/**
 * @file 带动画的球
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/3/3
 * @class BallAnimate
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

define(['cocos', 'sprites/ball'], function (cc, Ball) {
    var BALL_FRAME_NUM = 7;

    var ballFrameImage;
    var frames;
    var BALL_WIDTH;
    var BALL_TYPE_NUM;

    // 球每一走帧应该滚多远（球周长的一半 / 帧数）
    var DISTANCE_PER_FRAME;

    var initFrame = function () {
        var i, j;
        var oneTypeFrames;
        var spriteFrame;

        ballFrameImage = cc.textureCache.addImage('res/ball-animate-sprite.png');
        frames = [];
        BALL_WIDTH = ballFrameImage.pixelsWidth / BALL_FRAME_NUM;
        BALL_TYPE_NUM = ballFrameImage.pixelsHeight / BALL_WIDTH;

        DISTANCE_PER_FRAME = BALL_WIDTH * Math.PI * 0.5 / 7;

        for (i = 0; i < BALL_TYPE_NUM; i ++) {
            oneTypeFrames = [];
            for (j = 0; j < BALL_FRAME_NUM; j ++) {
                spriteFrame = new cc.SpriteFrame(
                    ballFrameImage,
                    cc.rect(j * BALL_WIDTH, i * BALL_WIDTH, BALL_WIDTH, BALL_WIDTH)
                );
                oneTypeFrames.push(spriteFrame);
            }
            frames.push(oneTypeFrames);
        }
    };

    return Ball.extend({
        ballId: 0,
        frames: null,
        curFrame: 3,

        // 当前这一帧停留多久了
        curFrameTime: 0.0,

        // 这一帧需要停留多久才换到下一帧
        nextFrameTime: 1,

        // 是否静止
        isStatic: true,

        ctor: function (ballId) {
            if (!ballFrameImage) {
                initFrame();
            }
            this.ballId = ballId;
            this.frames = frames[ballId] || frames[0];
            this._super(this.frames[this.curFrame]);
            this.setIgnoreBodyRotation(true);
        },

        onEnter: function () {
            this._super();
            this.scheduleUpdate();
        },

        onExit: function () {
            this.unscheduleUpdate();
            this._super();
        },


        nextFrame: function () {
            this.curFrame ++;
            if (this.curFrame >= BALL_FRAME_NUM) {
                this.curFrame = 0;
            }
            this.setDisplayFrame(this.frames[this.curFrame]);
            this.updateRotation();
        },

        // 计算当前速度
        calcVel: function () {
            var v = this.body.getVel();
            return Math.sqrt(v.x * v.x + v.y * v.y);
        },

        // 计算当前方向角度
        calcDirection: function () {
            var v = this.body.getVel();
            var rad = Math.atan2(v.y, v.x);
            return 0 - cc.radiansToDegrees(rad);
        },

        // 计算并修正下一帧的时间
        updateNextFrameTime: function () {
            var v = this.calcVel();
            if (v <= 0.0001) {
                this.isStatic = true;
            } else {
                this.isStatic = false;
                this.nextFrameTime = DISTANCE_PER_FRAME / v;
            }
        },

        // 修正球的旋转角度
        updateRotation: function () {
            if (this.isStatic) return;
            var deg = this.calcDirection();
            this.setRotation(deg);
        },

        update: function (dt) {
            this.curFrameTime += dt;
            this.updateNextFrameTime();
            if (this.isStatic) {return;}
            while (this.curFrameTime >= this.nextFrameTime) {
                this.nextFrame();
                this.curFrameTime -= this.nextFrameTime;
            }
        }
    });
});