# Interview Demo Frontend

Static frontend used only to demonstrate the standalone Interview Service. It has no connection to the existing SmartRecruit frontend, backend, database, or authentication.

## Run locally

Start `interview-service` first on port `8010`, then:

```powershell
cd interview-demo
.\run.ps1
```

The script reuses `ai-service\.venv` from this repository.

Open `http://127.0.0.1:4173`.

The demo asks for camera/microphone permission once. For every question, it uses browser Text-to-Speech, waits three seconds, then records video and audio for up to 30 seconds. Submitting early stops recording and uploads the short video in the background while the next question is prepared. Production integration should replace browser-only speech/media behavior with an STT/TTS provider and private object storage through Interview Service.
