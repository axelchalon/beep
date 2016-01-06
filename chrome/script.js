var Beep = function () {
	this.context = new AudioContext();
	
	this.gainNode = this.context.createGain();
	this.gainNode.gain.value = 0; // start silent
	
	this.oscillator = this.context.createOscillator();
	this.oscillator.type = 'square';
	
	// oscillator => gainNode => speakers
	this.oscillator.connect(this.gainNode);
	this.gainNode.connect(this.context.destination);
	
	this.oscillator.start(0); // Start generating sound immediately
}

Beep.prototype._between = function(min,max) {
	return Math.floor(Math.random()*(max-min)+min);	
}

Beep.prototype.playSound = function () {
	// change pitch immediately
	// setting this.oscillator.frequency.value directly triggers the portamento (pitch glide) on Chrome
	this.oscillator.frequency.setValueAtTime(this._between(80,700), 0);
	
	this.gainNode.gain.value = 0.1;
};

Beep.prototype.stopSound = function () {
	this.gainNode.gain.value = 0;
}

var beep = new Beep();

var keydownStream = Rx.Observable.fromEvent(document, 'keydown');

var eligibleKeysKeydownStream = keydownStream.filter(function (e) { // Stream of (mostly) non-control characters keydown events
	var keyCode = e.keyCode;

	var valid =
		(keyCode > 47 && keyCode < 58) || // number keys
		keyCode == 32 || keyCode == 8 || keyCode == 9 || keyCode == 27 || keyCode == 13 || // spacebar, backspace, tab, escape & return key
		(keyCode > 64 && keyCode < 91) || // letter keys
		(keyCode > 95 && keyCode < 112) || // numpad keys
		(keyCode > 185 && keyCode < 193) || // ;=,-./` (in order)
		(keyCode > 218 && keyCode < 223); // [\]' (in order)

	return valid;
});

var playSoundAndStopSoundStream = eligibleKeysKeydownStream.flatMapLatest(function (e) {
	return Rx.Observable.merge(
		Rx.Observable.just({
			event: 'stopSound'
		}),
		Rx.Observable.just({
			event: 'playSound',
			keyCode: e.keyCode // we pass it in case we want to calculate the oscillator frequency based on the keyCode
		}).delay(40), // 40ms of silence between the sounds to make it eVeN MoRe rOb0tic
		Rx.Observable.just({
			event: 'stopSound'
		}).delay(300)
	);
});

playSoundAndStopSoundStream.subscribe(function (data) {
	if (data.event == 'playSound')
		beep.playSound()
	else if (data.event == 'stopSound')
		beep.stopSound();
});