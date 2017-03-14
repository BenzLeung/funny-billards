/**
 * @file 一个简单的声音引擎，基于 Web Audio API
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/3/9
 * @license MIT
 * @version 0.0.10
 * @class benzAudioEngine
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

(function () {
    var AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
    var benzAudioEngine;
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

            var startTime = 0;
            var playedTime = 0;
            var paused = true;
            var source;
            var createNode = function () {
                var s = ctx['createBufferSource']();
                s.buffer = buffer;
                s['connect'](desNode);
                s['onended'] = function () {
                    if (!paused) {
                        release();
                    }
                };
                if (loopEnd) {
                    s['loop'] = true;
                    s['loopStart'] = loopStart;
                    s['loopEnd'] = loopEnd;
                }
                return s;
            };

            this.play = function () {
                if (source && !paused) {return id;}
                paused = false;
                source = createNode();
                startTime = ctx.currentTime - playedTime;
                if (source.start)
                    source.start(0, playedTime);
                else if (source['noteGrainOn'])
                    source['noteGrainOn'](0, playedTime);
                else
                    source['noteOn'](0, playedTime);
                return id;
            };
            this.pause = function () {
                playedTime = ctx.currentTime - startTime;
                paused = true;
                if (source) {
                    source.stop();
                }
            };
            this.stop = function () {
                paused = false;
                if (source) {
                    source.stop();
                }
                release();
            };
        };
        benzAudioEngine = {
            /**
             * 是否支持 Web Audio API
             * @return {boolean}
             */
            support: function () {
                return true;
            },

            /**
             * 加载音频文件
             * @param {string|string[]} srcArray 音频文件路径（或者多个路径组成的数组）
             * @param {function} [callback] 所有音频文件加载完毕后的回调
             */
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

            /**
             * 卸载音频文件，释放内存
             * @param {string|string[]} srcArray 音频文件路径（或者多个路径组成的数组）
             */
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

            /**
             * 播放音频文件，若文件尚未加载，则不播放（不会自动加载，也不会返回任何提示，
             *      因为游戏音效宁可不发声也不要延时发声）
             * @param {string} src 音频文件路径
             * @param {number} [loopStart] 循环开始时间
             * @param {number} [loopEnd] 循环结束时间，若不指定，则音频只播放一次
             * @return {int} 返回一个ID值，这个ID值用于操作暂停和停止，若不需要暂停和停止，
             *               则不需要理会这个返回值（不设置循环的话，音频播放完毕会自动停止）
             */
            play: function (src, loopStart, loopEnd) {
                var a = new BenzAudio(src, loopStart, loopEnd);
                return a.play();
            },

            /**
             * 暂停某个音频
             * @param {int} id 要暂停的音频的ID
             */
            pause: function (id) {
                if (audioList[id]) {
                    audioList[id].pause();
                }
            },

            /**
             * 继续播放某个音频
             * @param {int} id 已经暂停的音频的ID
             */
            resume: function (id) {
                if (audioList[id]) {
                    audioList[id].play();
                }
            },

            /**
             * 停止某个音频
             * @param {int} id 要暂停的音频的ID
             */
            stop: function (id) {
                if (audioList[id]) {
                    audioList[id].stop();
                }
            },

            /**
             * 设置音量，这是所有音频的统一音量，暂时没有对某个音频单独设置音量的功能
             * @param {number} vol 音量值，范围是 0.0 - 1.0
             */
            setVolume: function (vol) {
                if (!isMuted) {
                    volumeNode['gain'].value = vol;
                }
                volumeBeforeMuted = vol;
            },

            /**
             * 获得当前音量
             * @return {number} 音量，0.0 - 1.0
             */
            getVolume: function () {
                return volumeBeforeMuted;
            },

            /**
             * 设置静音，所有音频都静音，暂时没有对某个音频单独设置的功能
             * @param {boolean} muted 是否静音，true 为静音， false 为不静音
             */
            setMuted: function (muted) {
                isMuted = muted;
                if (muted) {
                    volumeNode['gain'].value = 0;
                } else {
                    volumeNode['gain'].value = volumeBeforeMuted;
                }
            },

            /**
             * 获得当前是否已静音
             * @return {boolean}
             */
            getMuted: function () {
                return isMuted;
            },

            /**
             * 暂停所有音频
             */
            pauseAll: function () {
                for (var i in audioList) {
                    if (audioList.hasOwnProperty(i)) {
                        if (audioList[i].pause) {
                            audioList[i].pause();
                        }
                    }
                }
            },

            /**
             * 停止所有音频
             */
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
        benzAudioEngine = {
            support: function () {
                return false;
            },
            load: emptyFunc,
            unload: emptyFunc,
            play: emptyFunc,
            pause: emptyFunc,
            stop: emptyFunc,
            setVolume: emptyFunc,
            setMuted: emptyFunc,
            getMuted: function () {
                return true;
            },
            pauseAll: emptyFunc,
            stopAll: emptyFunc
        }
    }


    if (typeof module !== 'undefined' && typeof exports === 'object') {
        module.exports = benzAudioEngine;
    } else if (typeof define === 'function' && define.amd) {
        define(function() {
            return benzAudioEngine;
        });
    } else {
        this.benzAudioEngine = benzAudioEngine;
    }
}).call(this || (typeof window !== 'undefined' ? window : global));