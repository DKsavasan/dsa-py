/* dsa.py — frame player (play / pause / step / scrub / speed). */
(function (root) {
  'use strict';
  const DSA = root.DSA;

  class Player {
    constructor(onFrame) {
      this.frames = [];
      this.i = 0;
      this.playing = false;
      this.speed = 1;
      this.base = 1100; // ms per step at 1x
      this.onFrame = onFrame;
      this.onState = () => {};
      this._t = null;
    }
    load(frames) {
      this.pause();
      this.frames = frames || [];
      this.i = 0;
      this.emit();
    }
    emit() {
      if (this.frames.length) this.onFrame(this.frames[this.i], this.i, this.frames.length);
      this.onState(this);
    }
    seek(i) {
      this.i = Math.max(0, Math.min(this.frames.length - 1, i));
      this.emit();
    }
    next() {
      if (this.i < this.frames.length - 1) { this.i++; this.emit(); return true; }
      this.pause();
      return false;
    }
    prev() { this.pause(); this.seek(this.i - 1); }
    first() { this.pause(); this.seek(0); }
    last() { this.pause(); this.seek(this.frames.length - 1); }
    play() {
      if (!this.frames.length) return;
      if (this.i >= this.frames.length - 1) this.seek(0);
      this.playing = true;
      this.onState(this);
      this._tick();
    }
    _tick() {
      clearTimeout(this._t);
      this._t = setTimeout(() => {
        if (!this.playing) return;
        if (this.next()) this._tick();
      }, this.base / this.speed);
    }
    pause() {
      this.playing = false;
      clearTimeout(this._t);
      this.onState(this);
    }
    toggle() { this.playing ? this.pause() : this.play(); }
    setSpeed(s) { this.speed = s; if (this.playing) this._tick(); this.onState(this); }
  }
  DSA.Player = Player;
})(typeof window !== 'undefined' ? window : globalThis);
