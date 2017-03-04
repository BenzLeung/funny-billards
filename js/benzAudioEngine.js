/**
 * @file 自制的简便声音引擎（cocos的不好用）
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/3/1
 * @class benzAudioEngine
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

define([], function () {
    // WebAudio Context
    var AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
    if (AudioContext) {
        var ctx = new AudioContext();

        var resList = {};
        var idCount = 1;
        var idRecycled = [];
        var audioList = {};

        var volumeNode = ctx['createGain']();
        var compressor = ctx['createDynamicsCompressor']();
        compressor['connect'](volumeNode);
        volumeNode['connect'](ctx['destination']);
        volumeNode['gain'].value = 1.0;
        var desNode = compressor;

        var isMuted = false;
        var volumeBeforeMuted = 1.0;

        var BenzBuffer = function (src) {
            var buffer = new Float32Array(0);
            var isLoaded = false;
            var onLoadFuncQueue = [];
            resList[src] = this;

            var load = function () {
                var request = new XMLHttpRequest();
                request.open('GET', src, true);
                request.responseType = 'arraybuffer';
                request.onload = function () {
                    ctx['decodeAudioData'](request.response, function (data) {
                        buffer = data;
                        isLoaded = true;
                        for (var i = 0, len = onLoadFuncQueue.length; i < len; i ++) {
                            var cb = onLoadFuncQueue[i];
                            if (typeof cb === 'function') {
                                cb();
                            }
                        }
                    }, function(){
                        //decode fail
                        isLoaded = true;
                        for (var i = 0, len = onLoadFuncQueue.length; i < len; i ++) {
                            var cb = onLoadFuncQueue[i];
                            if (typeof cb === 'function') {
                                cb();
                            }
                        }
                    });
                }.bind(this);
                request.send();
            }.bind(this);
            load();

            this.onload = function (fn) {
                if (isLoaded) {
                    fn();
                } else {
                    onLoadFuncQueue.push(fn);
                }
            };
            this.getBuffer = function () {
                return buffer;
            };
        };
        var BenzAudio = function (res, loopStart, loopEnd) {
            var release = function () {
                if (audioList[id]) {
                    idRecycled.push(id);
                    delete audioList[id];
                }
            };

            this.play = function () {
                release();
            };
            this.pause = function () {};
            this.stop = function () {};

            if (isMuted && !loopEnd) {
                return;
            }

            var buffer = null;
            var bufferObj = resList[res];


            if (bufferObj) {
                buffer = bufferObj.getBuffer();
            }
            if (!buffer) {
                return;
            }

            var id;
            if (idRecycled.length) {
                id = idRecycled.shift();
            } else {
                id = idCount ++;
            }
            audioList[id] = this;

            var createNode = function () {
                var s = ctx['createBufferSource']();
                s.buffer = buffer;
                s['connect'](desNode);
                s['onended'] = function () {
                    release();
                };
                if (loopEnd) {
                    s['loop'] = true;
                    s['loopStart'] = loopStart;
                    s['loopEnd'] = loopEnd;
                }
                return s;
            };

            var startTime = 0;
            var playedTime = 0;
            var source;
            this.play = function () {
                source = createNode();
                startTime = ctx.currentTime - playedTime;
                if (source.start)
                    source.start(playedTime);
                else if (source['noteGrainOn'])
                    source['noteGrainOn'](playedTime);
                else
                    source['noteOn'](playedTime);
                return id;
            };
            this.pause = function () {
                playedTime = ctx.currentTime - startTime;
                source.stop();
            };
            this.stop = function () {
                source.stop();
                release();
            };
        };
        return {
            load: function (srcArray, callback) {
                if (!(srcArray instanceof Array)) {
                    srcArray = [srcArray];
                }
                var i;
                var len = srcArray.length;
                var loadedCount = 0;
                var buf;
                for (i = 0; i < len; i ++) {
                    buf = new BenzBuffer(srcArray[i]);
                    buf.onload(function () {
                        loadedCount ++;
                        if (loadedCount >= len) {
                            if (typeof callback === 'function') {
                                callback();
                            }
                        }
                    });
                }
            },
            unload: function (srcArray) {
                if (!(srcArray instanceof Array)) {
                    srcArray = [srcArray];
                }
                var i;
                var len = srcArray.length;
                for (i = 0; i < len; i ++) {
                    if (resList[srcArray[i]]) {
                        delete resList[srcArray[i]];
                    }
                }
            },
            play: function (src, loopStart, loopEnd) {
                var a = new BenzAudio(src, loopStart, loopEnd);
                return a.play();
            },
            pause: function (id) {
                if (audioList[id]) {
                    audioList[id].pause();
                }
            },
            stop: function (id) {
                if (audioList[id]) {
                    audioList[id].stop();
                }
            },
            setVolume: function (vol) {
                if (!isMuted) {
                    volumeNode['gain'].value = vol;
                }
                volumeBeforeMuted = vol;
            },
            setMuted: function (muted) {
                isMuted = muted;
                if (muted) {
                    volumeNode['gain'].value = 0;
                } else {
                    volumeNode['gain'].value = volumeBeforeMuted;
                }
            },
            pauseAll: function () {
                for (var i in audioList) {
                    if (audioList.hasOwnProperty(i)) {
                        if (audioList[i].pause) {
                            audioList[i].pause();
                        }
                    }
                }
            },
            stopAll: function () {
                for (var i in audioList) {
                    if (audioList.hasOwnProperty(i)) {
                        if (audioList[i].stop) {
                            audioList[i].stop();
                        }
                    }
                }
            }
        };
    } else {
        var emptyFunc = function () {};
        return {
            load: emptyFunc,
            unload: emptyFunc,
            play: emptyFunc,
            pause: emptyFunc,
            stop: emptyFunc,
            setVolume: emptyFunc,
            setMuted: emptyFunc,
            pauseAll: emptyFunc,
            stopAll: emptyFunc
        }
    }

});