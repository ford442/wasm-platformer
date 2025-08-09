export class AudioManager {
  private audioContext: AudioContext;
  private gainNode: GainNode;
  private sfxBuffers: Map<string, AudioBuffer> = new Map();
  private musicSource: AudioBufferSourceNode | null = null;
  private musicBuffer: AudioBuffer | null = null;

  constructor() {
    this.audioContext = new window.AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  async loadSfx(name: string, url: string) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.sfxBuffers.set(name, audioBuffer);
  }

  async loadMusic(url: string) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this.musicBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  }

  playSfx(name: string) {
    const buffer = this.sfxBuffers.get(name);
    if (buffer && this.audioContext.state !== 'suspended') {
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.gainNode);
      source.start(0);
    }
  }

  playMusic() {
    if (this.musicBuffer && !this.musicSource) {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      this.musicSource = this.audioContext.createBufferSource();
      this.musicSource.buffer = this.musicBuffer;
      this.musicSource.loop = true;
      this.musicSource.connect(this.gainNode);
      this.musicSource.start(0);
    }
  }

  stopMusic() {
    if (this.musicSource) {
      this.musicSource.stop();
      this.musicSource.disconnect();
      this.musicSource = null;
    }
  }

  setVolume(volume: number) {
    this.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
  }

  resumeContext() {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}
