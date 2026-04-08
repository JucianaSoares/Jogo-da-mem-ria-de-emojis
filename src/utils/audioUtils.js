// Funções utilitárias de áudio
export function unlockAudio() {
  const silentAudio = new Audio();
  silentAudio.src = "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA..."; 
  // Base64 de um mp3 vazio (silêncio)

  silentAudio.play().then(() => {
    silentAudio.pause();
    silentAudio.currentTime = 0;
    console.log("Áudio desbloqueado com sucesso!");
  }).catch(() => {
    console.log("Não foi possível desbloquear o áudio, mas não há problema.");
  });
}