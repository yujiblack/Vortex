import { useState, useRef, useCallback } from "react";
import { Audio } from "expo-av";
import { readAsStringAsync, EncodingType } from "expo-file-system/legacy";
import {
  sendK8sCommand,
  sendDockerCommand,
  sendGrafanaCommand,
  transcribeAudio,
} from "@/services/api";

export type VoiceMode = "k8s" | "docker" | "grafana";

export type VoiceState =
  | "idle"
  | "recording"
  | "transcribing"
  | "translating"
  | "executing"
  | "done"
  | "error";

export interface VoiceResult {
  transcript: string;
  translated: string;
  result: string;
  error: string;
  detectedLocale: string;
}

export function useVoiceCommand(mode: VoiceMode, locale: string) {
  const recordingRef = useRef<Audio.Recording | null>(null);
  // Use a ref for "is recording" so stopAndProcess always sees the real value,
  // never a stale closure capture
  const isRecordingRef = useRef(false);

  const [state, setState] = useState<VoiceState>("idle");
  const [voiceResult, setVoiceResult] = useState<VoiceResult>({
    transcript: "",
    translated: "",
    result: "",
    error: "",
    detectedLocale: "",
  });

  const reset = useCallback(() => {
    setState("idle");
    isRecordingRef.current = false;
    setVoiceResult({
      transcript: "",
      translated: "",
      result: "",
      error: "",
      detectedLocale: "",
    });
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // Tear down any leftover recording
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch {}
        recordingRef.current = null;
      }
      isRecordingRef.current = false;

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        setState("error");
        setVoiceResult((v) => ({
          ...v,
          error: "Microphone permission denied.",
        }));
        return;
      }

      // Full reset of audio session before creating new recording
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        isMeteringEnabled: false,
        android: {
          extension: ".m4a",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: ".m4a",
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: "audio/webm",
          bitsPerSecond: 128000,
        },
      });

      recordingRef.current = recording;
      isRecordingRef.current = true;
      setState("recording");
      setVoiceResult({
        transcript: "",
        translated: "",
        result: "",
        error: "",
        detectedLocale: "",
      });
      console.log("🎙️ Recording started");
    } catch (e: any) {
      isRecordingRef.current = false;
      setState("error");
      setVoiceResult((v) => ({ ...v, error: `Failed to start: ${e.message}` }));
    }
  }, []);

  const stopAndProcess = useCallback(async () => {
    // Check the REF not the state — ref is always current, state can be stale in closures
    if (!recordingRef.current || !isRecordingRef.current) {
      console.log("⚠️ No active recording to stop");
      return;
    }

    // Mark as not recording immediately via ref so double-triggers are safe
    isRecordingRef.current = false;
    const recording = recordingRef.current;
    recordingRef.current = null;

    try {
      setState("transcribing");
      console.log("⏹️ Stopping recording...");

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      if (!uri) throw new Error("No recording URI — try again");

      console.log("📤 Reading audio...");
      const base64 = await readAsStringAsync(uri, {
        encoding: EncodingType.Base64,
      });

      console.log("📡 Sending to Groq Whisper...");
      const { transcript, detectedLocale } = await transcribeAudio(
        base64,
        locale,
      );
      console.log("📝 Transcript:", transcript, "locale:", detectedLocale);

      if (!transcript?.trim()) {
        throw new Error("Nothing heard — hold the button and speak clearly");
      }

      setVoiceResult((v) => ({ ...v, transcript, detectedLocale }));
      setState("translating");

      const effectiveLocale = detectedLocale || locale;
      setState("executing");

      let res: any;
      if (mode === "k8s")
        res = await sendK8sCommand(transcript, effectiveLocale);
      else if (mode === "docker")
        res = await sendDockerCommand(transcript, effectiveLocale);
      else res = await sendGrafanaCommand(transcript, effectiveLocale);

      console.log("✅ Done:", res);

      setVoiceResult({
        transcript,
        translated: res.translated || transcript,
        result: res.result || "",
        error: "",
        detectedLocale: effectiveLocale,
      });
      setState("done");
    } catch (e: any) {
      console.error("❌ Error:", e.message);
      setState("error");
      setVoiceResult((v) => ({
        ...v,
        error: e.message || "Something went wrong.",
      }));
    }
  }, [mode, locale]);

  // Typed text fallback — same pipeline, skips Whisper
  const execute = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setState("translating");
      setVoiceResult({
        transcript: text,
        translated: "",
        result: "",
        error: "",
        detectedLocale: locale,
      });
      try {
        setState("executing");
        let res: any;
        if (mode === "k8s") res = await sendK8sCommand(text, locale);
        else if (mode === "docker") res = await sendDockerCommand(text, locale);
        else res = await sendGrafanaCommand(text, locale);
        setVoiceResult({
          transcript: text,
          translated: res.translated || text,
          result: res.result || "",
          error: "",
          detectedLocale: locale,
        });
        setState("done");
      } catch (e: any) {
        setState("error");
        setVoiceResult((v) => ({
          ...v,
          error: e.message || "Something went wrong.",
        }));
      }
    },
    [mode, locale],
  );

  return {
    state,
    voiceResult,
    execute,
    reset,
    startRecording,
    stopAndProcess,
    isRecordingRef,
    isRecording: state === "recording",
    isProcessing:
      state === "transcribing" ||
      state === "translating" ||
      state === "executing",
  };
}
