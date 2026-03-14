FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o voxdeploy ./cmd/server/main.go

FROM gcr.io/distroless/static-debian12
WORKDIR /app
COPY --from=builder /app/voxdeploy .
EXPOSE 8080
CMD ["/app/voxdeploy"]
