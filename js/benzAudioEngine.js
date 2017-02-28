/**
 * @file 自制的简便声音引擎（cocos的不好用）
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/3/1
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

define(['cocos'], function (cc) {
    // WebAudio Context
    var AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
    if (AudioContext) {
        var ctx = new AudioContext();

        var resList = {};
        var idCount = 1;
        var idRecycled = [];
        var audioList = {};

        var volumeNode = ctx.createGain();
        var compressor = ctx.createDynamicsCompressor();
        compressor.connect(ctx.destination);
        volumeNode.connect(compressor);
        volumeNode.gain.value = 1.0;
        var destNode = volumeNode;

        var isMuted = false;

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
                    context.decodeAudioData(request.response, function (data) {
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
        var BenzAudio = function (res) {

        };
        // todo
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