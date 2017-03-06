/**
 * @file 台球桌
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/2/20
 * @class TableLayer
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

define([
    'cocos',
    'chipmunk',
    'sprites/ball',
    'sprites/ballAnimate',
    'sprites/ballCursor',
    'benzAudioEngine'
], function (cc, cp, Ball, BallAnimate, BallCursor, benzAudioEngine) {
    // 移动摩擦系数
    var MOVE_FRICTION = 1.0;
    // 移动摩擦系数的平方
    var MOVE_FRICTION_SQ = MOVE_FRICTION * MOVE_FRICTION;
    // 旋转摩擦系数
    var ROTATE_FRICTION = Math.PI * 2 / 360;

    // 发射母球的最大速度
    var SHOOT_MAX_SPEED = 1000;

    // 桌子尺寸
    var TABLE_WIDTH = 1402;
    var TABLE_HEIGHT = 777;

    // 桌子池的显示位置
    var TABLE_BG_X = 31;
    var TABLE_BG_Y = 12;
    // 桌子池的尺寸
    var TABLE_BG_WIDTH = TABLE_WIDTH - TABLE_BG_X * 2;
    var TABLE_BG_HEIGHT = TABLE_HEIGHT - TABLE_BG_Y * 2;
    // 桌子池的默认颜色
    var TABLE_BG_DEFAULT_COLOR = cc.color(51, 153, 0);

    // 墙壁位置（多边形版）
    var WALL_POLYGONS = [
        // 下左边
        [123, 77, 663, 77, 672, 33, 46, 0],
        // 下右边
        [741, 77, 1279, 77, 1356, 0, 732, 33],
        // 上左边
        [46, 777, 672, 733, 663, 700, 123, 700],
        // 上右边
        [732, 733, 1356, 777, 1279, 700, 741, 700],
        // 左边
        [0, 46, 0, 731, 77, 654, 77, 123],
        // 右边
        [1325, 123, 1325, 654, 1402, 731, 1402, 46]
    ];

    // 袋口半径
    var POCKET_RADIUS = 30;
    // 袋口位置
    var POCKET_POS = [
        // 左下袋
        [64, 64],
        // 左上袋
        [64, 713],
        // 右下袋
        [1338, 64],
        // 右上袋
        [1338, 713],
        // 下中袋
        [701, 46],
        // 上中袋
        [701, 731]
    ];

    // 球半径
    var BALL_RADIUS = 20;

    // 母球初始位置
    var MASTER_INITIAL_POS = [TABLE_WIDTH * 3 / 4, TABLE_HEIGHT / 2];

    // 第一球初始位置
    var BALL_INITIAL_POS = [TABLE_WIDTH / 4, TABLE_HEIGHT / 2];

    // 其他球相对于第一球的位置
    var BALLS_INITIAL_REL_POS = (function () {
        var pos = [
            // 第1列
            [0, 0]
        ];
        var i, j;
        var y, x;
        var r = BALL_RADIUS + 1;
        var xStep = 0 - Math.sqrt(r * r * 3 );
        x = xStep;
        for (i = 1; i < 5; i ++) {
            // 奇数列从中央开始，偶数列从两边开始
            if (i % 2 === 0) {
                // 奇数列先把中间的填了（i为偶数的列才是奇数列）
                pos.push([x, 0]);
                y = r * 2;
            } else {
                y = r;
            }
            // 第2列有2个球、第3列有3个球
            for (j = 0; j < i / 2; j ++) {
                pos.push([x, y]);
                pos.push([x, 0-y]);
                y += (r * 2);
            }
            x += xStep;
        }
        return pos;
    })();

    if (cc.sys.isMobile) {
        (function () {
            var i/*, j*/;
            var t;
            var v;
            t = TABLE_WIDTH;
            TABLE_WIDTH = TABLE_HEIGHT;
            TABLE_HEIGHT = t;
            for (i = 0; i < WALL_POLYGONS.length; i ++) {
                WALL_POLYGONS[i] = WALL_POLYGONS[i].reverse();
            }
            for (i = 0; i < POCKET_POS.length; i ++) {
                v = POCKET_POS[i];
                t = v[0];
                v[0] = v[1];
                v[1] = t;
            }

            t = MASTER_INITIAL_POS[0];
            MASTER_INITIAL_POS[0] = MASTER_INITIAL_POS[1];
            MASTER_INITIAL_POS[1] = TABLE_HEIGHT - t;

            t = BALL_INITIAL_POS[0];
            BALL_INITIAL_POS[0] = BALL_INITIAL_POS[1];
            BALL_INITIAL_POS[1] = TABLE_HEIGHT - t;


            for (i = 0; i < BALLS_INITIAL_REL_POS.length; i ++) {
                v = BALLS_INITIAL_REL_POS[i];
                t = v[0];
                v[0] = v[1];
                v[1] = 0 - t;
            }

            t = TABLE_BG_X;
            TABLE_BG_X = TABLE_BG_Y;
            TABLE_BG_Y = t;
            t = TABLE_BG_WIDTH;
            TABLE_BG_WIDTH = TABLE_BG_HEIGHT;
            TABLE_BG_HEIGHT = t;
        })();
    }

    var STATUS_READY = 0;
    var STATUS_RUNNING = 1;
    var STATUS_WAIT = 2;
    var STATUS_CLEAR = 10;

    var TableLayer = cc.Layer.extend({

        // 母球 sprite
        masterBall: null,

        // 发射后记录信息在此，方便存档
        shoot: {
            shooting: false,
            force: 0,
            cursor: {
                x : 0,
                y : 0
            }
        },

        // 球 sprite 数组（不含母球）
        balls: [],

        // 瞄准球的光标 BallCursor
        ballCursor: null,

        // 瞄准球的线 DrawNode
        ballLine: null,

        // 当前桌子状态：等待发射、运转中
        status: STATUS_RUNNING,

        // 球的数量
        ballCount: 0,

        // 位运算，每一位表示一个球，0为静止、1为运动（方便判断是否整桌静止）
        runningBit: 0,

        // 记录所有进球的编号
        goalBallsNumber: [],

        // 记录当前是第几回合
        turns: 0,

        // 记录本次运转的进球的编号（然后派发事件）
        goalBallsNumberOneTurn: [],

        // 记录本次运转是否进了母球
        isMasterGoal: false,

        // 记录连击数
        combo: 0,

        // 记录最大连击数
        maxCombo: 0,

        // 是否静音（不是用来给用户控制静音的，而是因为复位球的时候会产生碰撞……）
        mute: false,

        ctor : function () {
            this._super();

            this.setContentSize(TABLE_WIDTH, TABLE_HEIGHT);

            this.space = new cp.Space();
            this.initSpace();

            this.balls = [];
            for (var i = 0; i < 10; i ++) {
                var ball = this.addBallAnimate(i);
                ball.body.number = i;
                this.balls.push(ball);
            }

            this.ballCursor = new BallCursor(BALL_RADIUS);
            this.ballLine = new cc.DrawNode();
            this.addChild(this.ballLine, 11);
            this.addChild(this.ballCursor, 12);

            this.masterBall = this.addBall('res/masterball.png');
            this.masterBall.isMaster = true;
            this.masterBall.body.number = 10;

            this.loadTableStateFromLocalStorage();

            this.scheduleUpdate();
        },

        initSpace : function () {
            var i;
            var wall;
            var pocket;

            // 物理空间
            var space = this.space;

            // 固定不动的物体
            var staticBody = space.staticBody;

            // 没有重力
            space.gravity = cp.v(0, 0);

            // 创建矩形桌面
            var desktop = new cp.BoxShape2(staticBody, new cp.BB(0, 0, TABLE_WIDTH, TABLE_HEIGHT));
            desktop.setElasticity(0);
            desktop.setFriction(0);
            desktop.setSensor(true);
            desktop.setCollisionType(1);
            space.addStaticShape(desktop);

            // 创建墙壁（多边形版）
            for (i = 0; i < WALL_POLYGONS.length; i ++) {
                wall = new cp.PolyShape(staticBody,
                    WALL_POLYGONS[i],
                    cp.vzero);
                // 弹性
                wall.setElasticity(1);
                // 摩擦力
                wall.setFriction(0.1);
                // 碰撞物件类型标识（方便自定义碰撞事件）
                wall.setCollisionType(3);
                // 加入固定不动的物体（墙）到物理空间
                space.addStaticShape(wall);
            }

            // 创建袋口
            var pocketBodyRadius = POCKET_RADIUS - BALL_RADIUS;
            for (i = 0; i < POCKET_POS.length; i ++) {
                // 袋口body半径要减去球的半径，但是袋口显示时候不用减，这样只要球“碰撞”到袋口就认为进袋了
                pocket = new cp.CircleShape(staticBody, pocketBodyRadius, cp.v(POCKET_POS[i][0], POCKET_POS[i][1]));
                pocket.setElasticity(0);
                pocket.setFriction(0);
                pocket.setSensor(true);
                pocket.setCollisionType(2);
                space.addStaticShape(pocket);
            }

            // 调试显示
            /*this._debugNode = new cc.PhysicsDebugNode(this.space);
            this.addChild(this._debugNode, 2);*/

            // 桌子池（纯色）
            this.tableBg = new cc.LayerColor(TABLE_BG_DEFAULT_COLOR, TABLE_BG_WIDTH, TABLE_BG_HEIGHT);
            this.tableBg.setPosition(TABLE_BG_X, TABLE_BG_Y);
            this.addChild(this.tableBg, 0);

            // 桌子边框
            this.tableBorder = new cc.Sprite('res/table.png');
            if (cc.sys.isMobile) {
                this.tableBorder.setRotation(-90);
            }
            this.tableBorder.setPosition(TABLE_WIDTH / 2, TABLE_HEIGHT / 2);
            this.addChild(this.tableBorder, 1);
        },

        desktopPreSolve: function (arbiter, space) {
            var shapes = arbiter.getShapes();
            //var desktop = shapes[0];
            var ball = shapes[1];
            var ballBody = ball.getBody();

            var vx = ballBody.vx;
            var vy = ballBody.vy;
            var w = ballBody.w;
            if (vx === 0 && vy === 0 && w === 0) {
                this.setRunning(ballBody.number, false);
                return false;
            } else {
                this.setRunning(ballBody.number, true);
            }

            /*/////////////
             (m*x)^2 + (m*y)^2 = F^2
             ->  m^2 * x^2 + m^2 * y^2 = F^2
             ->  m^2 * (x^2 + y^2) = F^2
             ->  m^2 = F^2 / (x^2 + y^2)
             /////////////*/
            var frictionSQ = ballBody.sprite.frictionSQ;
            var m_sq = frictionSQ / (vx * vx + vy * vy);
            var m = Math.sqrt(m_sq);

            if (m > 1) {
                ballBody.vx = 0;
                ballBody.vy = 0;
            } else {
                ballBody.vx = vx - m * vx;
                ballBody.vy = vy - m * vy;
            }

            var rotateFriction = ballBody.sprite.rotateFriction;
            if (Math.abs(w) > rotateFriction) {
                if (w > 0) {
                    ballBody.w -= rotateFriction;
                } else {
                    ballBody.w += rotateFriction;
                }
            } else {
                ballBody.w = 0;
            }

            return false;
        },

        pocketCollisionBegan: function (arbiter, space) {
            var shapes = arbiter.getShapes();
            //var desktop = shapes[0];
            var ballShape = shapes[1];
            var ballBody = ballShape.getBody();
            var ballSprite = ballBody.sprite;

            if (ballSprite.isMaster) {
                this.isMasterGoal = true;
                this.playEffect('res/lost-master.mp3');
            } else {
                this.goalBallsNumberOneTurn.push(ballBody.number);
                this.goalBallsNumber.push(ballBody.number);
                this.playEffect('res/goal.mp3');
            }

            space.addPostStepCallback(function () {
                this.removeBall(ballSprite);
            }.bind(this));

            return false;
        },

        wallCollisionBegan: function () {
            this.playEffect('res/hit-wall.mp3');
            return true;
        },

        ballCollisionBegan: function () {
            this.playEffect('res/hit-ball.mp3');
            return true;
        },

        onEnter: function() {
            this._super();
            this.space.addCollisionHandler(1, 0, null, this.desktopPreSolve.bind(this), null, null);
            this.space.addCollisionHandler(2, 0, this.pocketCollisionBegan.bind(this), null, null, null);
            this.space.addCollisionHandler(3, 0, this.wallCollisionBegan.bind(this), null, null, null);
            this.space.addCollisionHandler(0, 0, this.ballCollisionBegan.bind(this), null, null, null);
        },

        onExit: function() {
            this.space.removeCollisionHandler(1, 0);
            this.space.removeCollisionHandler(2, 0);
            this.space.removeCollisionHandler(3, 0);
            this.space.removeCollisionHandler(0, 0);
            this._super();
        },

        pause: function () {
            this.pauseBallAnimate();
            this._super();
        },

        resume: function () {
            this._super();
            this.resumeBallAnimate();
        },

        addBall: function (pngName) {
            pngName = pngName || 'res/ball.png';
            return new Ball(pngName);
        },

        addBallAnimate: function (ballId) {
            return new BallAnimate(ballId);
        },

        pauseBallAnimate: function () {
            for (var i = 0, len = this.balls.length; i < len; i ++) {
                this.balls[i].pause();
            }
        },

        resumeBallAnimate: function () {
            for (var i = 0, len = this.balls.length; i < len; i ++) {
                this.balls[i].resume();
            }
        },

        removeBall: function (ballSprite) {
            var ballBody = ballSprite.body;
            var ballShape = ballSprite.shape;
            if (ballBody.isRogue()) {return;}
            this.space.removeBody(ballBody);
            this.space.removeShape(ballShape);
            ballSprite.removeFromParent(true);
            this.ballCount --;
            this.setRunning(ballBody.number, false);
        },

        resetBall: function (ballSprite, pos) {
            ballSprite.setPosition(pos);
            ballSprite.body.setVel(cp.vzero);
            ballSprite.body.setAngVel(0);
            if (ballSprite.body.isRogue()) {
                this.ballCount ++;
                this.space.addBody(ballSprite.body);
                this.space.addShape(ballSprite.shape);
                this.addChild(ballSprite, 5);
            }
        },

        resetMasterBall: function () {
            this.resetBall(this.masterBall, cc.p(MASTER_INITIAL_POS[0], MASTER_INITIAL_POS[1]));
            this.setAimLine(this.ballCursor.getPosition());
        },

        posInTable: function (pos) {
            var theRect = cc.rect(BALL_RADIUS, BALL_RADIUS, TABLE_WIDTH - BALL_RADIUS * 2, TABLE_HEIGHT - BALL_RADIUS * 2);
            return cc.rectContainsPoint(theRect, pos);
        },

        showAimLine: function () {
            this.ballCursor.setVisible(true);
            this.ballLine.setVisible(true);
        },

        hideAimLine: function () {
            this.ballCursor.setVisible(false);
            this.ballLine.setVisible(false);
        },

        setAimLine: function (pos) {
            if (this.posInTable(pos)) {
                this.ballCursor.setPosition(pos);
                this.ballLine.clear();
                this.ballLine.drawSegment(this.masterBall.getPosition(), pos, 1, cc.color(255, 255, 255));
                if (!this.ballCursor.isVisible()) {
                    this.showAimLine();
                }
            } else {
                if (this.ballCursor.isVisible()) {
                    this.hideAimLine();
                }
            }
        },

        shootMasterBall: function (force, pos) {
            var curPos = this.masterBall.getPosition();
            pos = pos || this.ballCursor.getPosition();
            force = force || 1.0;
            var dx = pos.x - curPos.x;
            var dy = pos.y - curPos.y;
            if (dx === 0 && dy === 0) {
                return;
            }
            var m_sq = SHOOT_MAX_SPEED * SHOOT_MAX_SPEED / (dx * dx + dy * dy);
            var m = Math.sqrt(m_sq);
            var v = new cp.Vect(m * dx * force, m * dy * force);

            this.hideAimLine();
            this.setStatus(STATUS_WAIT);
            this.shoot.shooting = true;
            this.shoot.force = force;
            this.shoot.cursor.x = pos.x;
            this.shoot.cursor.y = pos.y;
            this.saveTableStateToLocalStorage();
            setTimeout(function () {
                this.masterBall.body.setVel(v);
                this.setRunning(this.masterBall.body.number, true);
                this.playEffect('res/shoot.mp3');
            }.bind(this), 450);
        },

        resetTable: function () {
            this.resetMasterBall();

            for (var i = 0, len = this.balls.length; i < len; i ++) {
                var x = BALL_INITIAL_POS[0] + BALLS_INITIAL_REL_POS[i][0];
                var y = BALL_INITIAL_POS[1] + BALLS_INITIAL_REL_POS[i][1];
                this.resetBall(this.balls[i], cc.p(x, y));
            }

            this.goalBallsNumber = [];
            this.turns = 0;
            this.isMasterGoal = false;
            this.goalBallsNumberOneTurn = [];
            this.combo = 0;
            this.maxCombo = 0;
            this.shoot.shooting = false;
            this.setStatus(STATUS_READY);
            this.turns = 0;
            this.saveTableStateToLocalStorage();

            cc.eventManager.dispatchCustomEvent('table:reset');
        },

        setRunning: function (ballNumber, isRunning) {
            // 球的编号第几，就是第几位
            var ballBit = 1 << ballNumber;
            if (isRunning) {
                // “或”运算，把对应的位，置为1
                this.runningBit = this.runningBit | ballBit;
                this.setStatus(STATUS_RUNNING);
            } else {
                // “与非”运算，把对应的位，置为0 （先非后与）
                this.runningBit = this.runningBit & (~ballBit);
            }
        },

        setStatus: function (status) {
            if (status === this.status) {
                return;
            }
            var oldStatus = this.status;
            this.status = status;
            if (status === STATUS_RUNNING) {
                cc.eventManager.dispatchCustomEvent('table:status_running');
            } else if (status === STATUS_READY) {
                if (this.space.locked) {
                    this.space.addPostStepCallback(function () {
                        this.checkOneTurn();
                        if (this.ballCount !== 1) {
                            cc.eventManager.dispatchCustomEvent('table:status_ready');
                            this.saveTableStateToLocalStorage();
                        }
                    }.bind(this));
                } else {
                    this.checkOneTurn();
                    if (this.ballCount !== 1) {
                        cc.eventManager.dispatchCustomEvent('table:status_ready');
                        this.saveTableStateToLocalStorage();
                    }
                }
            } else if (status === STATUS_CLEAR) {
                cc.eventManager.dispatchCustomEvent('table:status_clear', {
                    turns: this.turns,
                    maxCombo: this.maxCombo
                });
                this.removeTableStateFromLocalStorage();
            } else if (status === STATUS_WAIT) {
                cc.eventManager.dispatchCustomEvent('table:status_wait');
            }
            cc.eventManager.dispatchCustomEvent('table:status_change', {'old': oldStatus, 'new': status});
        },

        // 一轮运动结束后的各种检查（母球落袋、是否全清）
        checkOneTurn: function () {
            var i, len;
            var isClear = false;

            this.turns ++;

            if (this.isMasterGoal) {
                for (i = 0, len = this.goalBallsNumberOneTurn.length; i < len; i ++) {
                    this.resetBall(
                        this.balls[this.goalBallsNumberOneTurn[i]],
                        cc.p(
                            BALL_INITIAL_POS[0] + BALLS_INITIAL_REL_POS[i][0],
                            BALL_INITIAL_POS[1] + BALLS_INITIAL_REL_POS[i][1]
                        )
                    );
                    this.goalBallsNumber.pop();
                }
                this.resetMasterBall();
                this.combo = 0;
                this.turns ++;
                cc.eventManager.dispatchCustomEvent('table:master_goal');
            } else {
                if (this.goalBallsNumberOneTurn.length > 0) {
                    this.combo ++;
                    this.maxCombo = Math.max(this.combo, this.maxCombo);
                    cc.eventManager.dispatchCustomEvent('table:goal', {
                        goals: this.goalBallsNumberOneTurn,
                        turns: this.turns,
                        combo: this.combo
                    });
                    if (this.ballCount === 1) {
                        isClear = true;
                    }
                } else {
                    this.combo = 0;
                    cc.eventManager.dispatchCustomEvent('table:no_goal');
                }
            }

            cc.eventManager.dispatchCustomEvent('table:one_turn');
            if (isClear) {
                this.setStatus(STATUS_CLEAR);
            }

            // reset
            this.isMasterGoal = false;
            this.goalBallsNumberOneTurn = [];
            this.shoot.shooting = false;
        },

        getTableStateJSON: function () {
            var json = {
                'masterBall' : {
                    'x' : this.masterBall.getPositionX(),
                    'y' : this.masterBall.getPositionY(),
                    'shooting' : this.shoot.shooting,
                    'force' : this.shoot.force,
                    'cursor' : {
                        'x' : this.shoot.cursor.x,
                        'y' : this.shoot.cursor.y
                    }
                },
                'balls' : [],
                'turns' : this.turns,
                'combo' : this.combo,
                'maxCombo' : this.maxCombo,
                'goalBallsNumber' : this.goalBallsNumber.slice(0)
            };
            var i, len;
            var goalBallsHash = {};
            for (i = 0, len = json.goalBallsNumber.length; i < len; i ++) {
                goalBallsHash[json.goalBallsNumber[i]] = true;
            }
            for (i = 0, len = this.balls.length; i < len; i ++) {
                json.balls.push({
                    'x' : this.balls[i].getPositionX(),
                    'y' : this.balls[i].getPositionY(),
                    'isGoal' : !!goalBallsHash[i]
                });
            }
            return json;
        },

        loadTableStateByJSON: function (jsonObject) {
            var i, len;
            var pos;
            var ball;
            pos = cc.p(jsonObject.masterBall.x, jsonObject.masterBall.y);
            this.resetBall(this.masterBall, pos);
            for (i = 0, len = this.balls.length; i < len; i ++) {
                ball = jsonObject.balls[i];
                pos = cc.p(ball.x, ball.y);
                if (ball.isGoal) {
                    this.removeBall(this.balls[i]);
                } else {
                    this.resetBall(this.balls[i], pos);
                }
            }
            this.turns = jsonObject.turns;
            this.combo = jsonObject.combo;
            this.maxCombo = jsonObject.maxCombo;
            this.goalBallsNumber = jsonObject.goalBallsNumber;
            this.setStatus(STATUS_READY);
            this.turns = jsonObject.turns;
            this.combo = jsonObject.combo;
            this.maxCombo = jsonObject.maxCombo;
            this.goalBallsNumber = jsonObject.goalBallsNumber;
            if (jsonObject.masterBall.shooting) {
                pos = cc.p(jsonObject.masterBall.cursor.x, jsonObject.masterBall.cursor.y);
                this.shootMasterBall(jsonObject.masterBall.force, pos);
            }
        },

        saveTableStateToLocalStorage: function () {
            if (this.ballCount <= 1 || this.turns < 2) {
                return;
            }
            var jsonObject = this.getTableStateJSON();
            var jsonString = JSON.stringify(jsonObject);
            cc.sys.localStorage.setItem('tableState', jsonString);
        },

        loadTableStateFromLocalStorage: function () {
            var jsonString = cc.sys.localStorage.getItem('tableState');
            if (jsonString) {
                var jsonObject = JSON.parse(jsonString);
                this.loadTableStateByJSON(jsonObject);
            } else {
                this.resetTable();
            }
        },

        removeTableStateFromLocalStorage: function () {
            cc.sys.localStorage.removeItem('tableState');
        },

        playEffect: function (res) {
            if (!this.mute) {
                benzAudioEngine.play(res);
            }
        },

        setTableColor: function (color) {
            this.tableBg.setColor(color);
        },

        resetTableColor: function () {
            this.tableBg.setColor(TABLE_BG_DEFAULT_COLOR);
        },

        update: function (dt) {
            this._super(dt);
            // chipmunk step
            if (this.status === STATUS_RUNNING) {
                var l = Math.round(60 / (1 / dt));
                if (l < 1) {
                    l = 1;
                }
                for (var i = 0; i < l; i ++) {
                    this.space.step(1 / 60);
                    if (!this.runningBit) {
                        this.setStatus(STATUS_READY);
                    }
                }
            } else {
                this.space.step(1 / 60);
            }
        }
    });

    TableLayer.TABLE_WIDTH = TABLE_WIDTH;
    TableLayer.TABLE_HEIGHT = TABLE_HEIGHT;
    TableLayer.POCKET_RADIUS = POCKET_RADIUS;
    TableLayer.BALL_RADIUS = BALL_RADIUS;

    TableLayer.STATUS_READY = STATUS_READY;
    TableLayer.STATUS_WAIT = STATUS_WAIT;
    TableLayer.STATUS_RUNNING = STATUS_RUNNING;
    TableLayer.STATUS_CLEAR = STATUS_CLEAR;

    return TableLayer;
});