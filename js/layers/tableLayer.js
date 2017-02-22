/**
 * @file 台球桌
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/2/20
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

define(['cocos', 'chipmunk', 'sprites/ball', 'sprites/ballCursor'], function (cc, cp, Ball, BallCursor) {
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

    // 墙壁半径
    /*var S;
    var WALL_RADIUS = S = 10;
    // 墙壁位置（线段版）
    var WALL_SEGMENTS = [
        // 下边
        [cp.v(123+S, 77-S), cp.v(663-S, 77-S)],
        [cp.v(741+S, 77-S), cp.v(1279-S, 77-S)],
        // 上边
        [cp.v(123+S, 700+S), cp.v(663-S, 700+S)],
        [cp.v(741+S, 700+S), cp.v(1279-S, 700+S)],
        // 左边
        [cp.v(77-S, 123+S), cp.v(77-S, 654-S)],
        // 右边
        [cp.v(1325+S, 123+S), cp.v(1325+S, 654-S)],
        // 左下袋
        [cp.v(77-S, 123+S), cp.v(0-S, 46+S)],
        [cp.v(123+S, 77-S), cp.v(46+S, 0-S)],
        // 左上袋
        [cp.v(77-S, 654-S), cp.v(0-S, 731-S)],
        [cp.v(123+S, 700+S), cp.v(46+S, 777+S)],
        // 右下袋
        [cp.v(1279-S, 77-S), cp.v(1356-S, 0-S)],
        [cp.v(1325+S, 123+S), cp.v(1402+S, 46+S)],
        // 右上袋
        [cp.v(1279-S, 700+S), cp.v(1356-S, 777+S)],
        [cp.v(1325+S, 654-S), cp.v(1402+S, 731-S)],
        // 下中袋
        [cp.v(663-S, 77-S), cp.v(672-S, 33-S)],
        [cp.v(741+S, 77-S), cp.v(732+S, 33-S)],
        // 上中袋
        [cp.v(663-S, 700+S), cp.v(672-S, 733+S)],
        [cp.v(741+S, 700+S), cp.v(732+S, 733+S)]
    ];*/

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
        var xStep = 0 - Math.sqrt(BALL_RADIUS * BALL_RADIUS * 3 );
        x = xStep;
        for (i = 1; i < 5; i ++) {
            // 奇数列从中央开始，偶数列从两边开始
            if (i % 2 === 0) {
                // 奇数列先把中间的填了（i为偶数的列才是奇数列）
                pos.push([x, 0]);
                y = BALL_RADIUS * 2;
            } else {
                y = BALL_RADIUS;
            }
            // 第2列有2个球、第3列有3个球
            for (j = 0; j < i / 2; j ++) {
                pos.push([x, y]);
                pos.push([x, 0-y]);
                y += (BALL_RADIUS * 2);
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
            /*for (i = 0; i < WALL_SEGMENTS.length; i ++) {
                for (j = 0; j < WALL_SEGMENTS[i].length; j ++) {
                    v = WALL_SEGMENTS[i][j];
                    t = v.x;
                    v.x = v.y;
                    v.y = t;
                }
            }*/
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
        })();
    }

    var STATUS_WAIT = 0;
    var STATUS_RUNNING = 1;
    var STATUS_CLEAR = 10;

    return cc.Layer.extend({

        // 母球 sprite
        masterBall: null,

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

        // 记录本次运转的进球的编号（然后派发事件）
        goalBallsNumberOneTurn: [],

        // 记录本次运转是否进了母球
        isMasterGoal: false,

        ctor : function () {
            this._super();

            var winSize = cc.director.getWinSize();

            this.setContentSize(TABLE_WIDTH, TABLE_HEIGHT);
            this.ignoreAnchorPointForPosition(false);
            this.setAnchorPoint(0.5, 0.5);
            this.setPosition(winSize.width / 2, winSize.height / 2);

            this.space = new cp.Space();
            this.initSpace();

            for (var i = 0; i < 10; i ++) {
                var x = BALL_INITIAL_POS[0] + BALLS_INITIAL_REL_POS[i][0];
                var y = BALL_INITIAL_POS[1] + BALLS_INITIAL_REL_POS[i][1];
                this.balls.push(this.addBall(cc.p(x, y), cp.vzero));
            }

            this.ballCursor = new BallCursor(BALL_RADIUS);
            this.ballLine = new cc.DrawNode();
            this.addChild(this.ballLine, 11);
            this.addChild(this.ballCursor, 12);

            this.masterBall = this.addBall(cc.p(MASTER_INITIAL_POS[0], MASTER_INITIAL_POS[1]), cp.vzero, 'res/masterball.png');
            this.masterBall.isMaster = true;

            if (cc.sys.capabilities['touches']) {
                this.initTouch();
            } else {
                this.initMouse();
            }

            this.scheduleUpdate();

            // todo:临时代码（清理）
            cc.eventManager.addCustomListener('table:status_clear', function () {
                alert('清袋！');
                this.resetTable();
            }.bind(this));
            cc.eventManager.addCustomListener('table:master_goal', function () {
                alert('进白球啦！');
            }.bind(this));
            cc.eventManager.addCustomListener('table:goal', function (event) {
                alert('进了%d个球啦！'.replace('%d', event.getUserData().length));
            }.bind(this));
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

            // 创建墙壁（线段版）
            /*for(i=0; i < WALL_SEGMENTS.length; i++ ) {
                wall = new cp.SegmentShape(staticBody,
                    WALL_SEGMENTS[i][0],
                    WALL_SEGMENTS[i][1],
                    WALL_RADIUS);
                // 弹性
                wall.setElasticity(1);
                // 摩擦力
                wall.setFriction(0.1);
                // 加入固定不动的物体（墙）到物理空间
                space.addStaticShape(wall);
            }*/

            // 创建墙壁（多边形版）
            for (i = 0; i < WALL_POLYGONS.length; i ++) {
                wall = new cp.PolyShape(staticBody,
                    WALL_POLYGONS[i],
                    cp.vzero);
                // 弹性
                wall.setElasticity(1);
                // 摩擦力
                wall.setFriction(0.1);
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
                pocket.setSensor(true);pocket.setCollisionType(2);
                space.addStaticShape(pocket);
            }

            // 调试显示
            this._debugNode = new cc.PhysicsDebugNode(this.space);
            this.addChild(this._debugNode, 1);
        },

        initMouse: function () {
            var mouseListener = cc.EventListener.create({
                event: cc.EventListener.MOUSE,
                onMouseMove: function (event) {
                    var target = event.getCurrentTarget();
                    if (target.status !== STATUS_WAIT) return false;
                    var pos = target.convertToNodeSpace(event.getLocation());
                    target.setAimLine(pos);
                },
                onMouseUp: function (event) {
                    var target = event.getCurrentTarget();
                    if (target.status !== STATUS_WAIT) return false;
                    if (event.getButton() == cc.EventMouse.BUTTON_LEFT) {
                        target.shootMasterBall();
                    }
                }
            });
            cc.eventManager.addListener(mouseListener, this);

            // 鼠标和触屏的控制光标的方式不一样，因此显示/隐藏光标的逻辑也不一样，于是分别写
            cc.eventManager.addCustomListener('table:status_running', function () {
                this.hideAimLine();
            }.bind(this));
        },

        initTouch: function () {
            this.shootButton = new cc.LabelTTF('发射!', 'Microsoft Yahei', 100);
            this.shootButton.setPosition(TABLE_WIDTH / 2, 0 - 60);
            this.addChild(this.shootButton, 5);

            var touchListener = cc.EventListener.create({
                event: cc.EventListener.TOUCH_ONE_BY_ONE,
                onTouchBegan: function (touch, event) {
                    var target = event.getCurrentTarget();
                    if (target.status !== STATUS_WAIT) return false;
                    var shootButton = target.shootButton;
                    var shootButtonRect = shootButton.getBoundingBox();
                    var touchPos = target.convertToNodeSpace(touch.getLocation());
                    if (cc.rectContainsPoint(shootButtonRect, touchPos)) {
                        target.shootMasterBall();
                        return false;
                    }
                    return true;
                },
                onTouchMoved: function (touch, event) {
                    var target = event.getCurrentTarget();
                    if (target.status !== STATUS_WAIT) return false;
                    var delta = touch.getDelta();
                    var curPos = target.ballCursor.getPosition();
                    var theRect = cc.rect(BALL_RADIUS, BALL_RADIUS, TABLE_WIDTH - BALL_RADIUS, TABLE_HEIGHT - BALL_RADIUS);
                    curPos = cc.pAdd(curPos, delta);
                    curPos = cc.pClamp(curPos, cc.p(theRect.x, theRect.y), cc.p(theRect.width, theRect.height));
                    target.setAimLine(curPos);
                    return true;
                }
            });
            cc.eventManager.addListener(touchListener, this);
            this.setAimLine(cc.p(TABLE_WIDTH / 2, TABLE_HEIGHT / 2));

            // 鼠标和触屏的控制光标的方式不一样，因此显示/隐藏光标的逻辑也不一样，于是分别写
            cc.eventManager.addCustomListener('table:status_wait', function () {
                this.setAimLine(this.ballCursor.getPosition());
            }.bind(this));
            cc.eventManager.addCustomListener('table:status_running', function () {
                this.hideAimLine();
            }.bind(this));
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
            } else {
                this.goalBallsNumberOneTurn.push(ballBody.number);
                this.goalBallsNumber.push(ballBody.number);
            }

            space.addPostStepCallback(function () {
                space.removeBody(ballBody);
                space.removeShape(ballShape);
                ballSprite.removeFromParent(true);
                this.ballCount --;
                this.setRunning(ballBody.number, false);
            }.bind(this));

            return false;
        },

        onEnter: function() {
            this._super();
            this.space.addCollisionHandler(1, 0, null, this.desktopPreSolve.bind(this), null, null);
            this.space.addCollisionHandler(2, 0, this.pocketCollisionBegan.bind(this), null, null, null);
        },

        onExit: function() {
            this.space.removeCollisionHandler(1, 0);
            this.space.removeCollisionHandler(2, 0);
            this._super();
        },

        addBall: function (pos, vel, pngName) {
            pngName = pngName || 'res/ball.png';
            var sprite = new Ball(pngName);
            sprite.setPosition(pos);
            sprite.body.setVel(vel);
            sprite.body.number = this.ballCount;
            if (!cp.v.eql(vel, cp.vzero)) {
                this.setRunning(this.ballCount, true);
            }
            this.ballCount ++;
            this.space.addBody(sprite.body);
            this.space.addShape(sprite.shape);
            this.addChild(sprite, 5);

            return sprite;
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

        showAimLine: function () {
            this.ballCursor.setVisible(true);
            this.ballLine.setVisible(true);
        },

        hideAimLine: function () {
            this.ballCursor.setVisible(false);
            this.ballLine.setVisible(false);
        },

        setAimLine: function (pos) {
            var theRect = cc.rect(BALL_RADIUS, BALL_RADIUS, TABLE_WIDTH - BALL_RADIUS * 2, TABLE_HEIGHT - BALL_RADIUS * 2);
            if (cc.rectContainsPoint(theRect, pos)) {
                this.ballCursor.setPosition(pos);
                this.ballLine.clear();
                this.ballLine.drawSegment(this.masterBall.getPosition(), pos, 1, cc.color(128, 128, 128));
                if (!this.ballCursor.isVisible()) {
                    this.showAimLine();
                }
            } else {
                if (this.ballCursor.isVisible()) {
                    this.hideAimLine();
                }
            }
        },

        shootMasterBall: function (pos) {
            var curPos = this.masterBall.getPosition();
            pos = pos || this.ballCursor.getPosition();
            var dx = pos.x - curPos.x;
            var dy = pos.y - curPos.y;
            if (dx === 0 && dy === 0) {
                return;
            }
            var m_sq = SHOOT_MAX_SPEED * SHOOT_MAX_SPEED / (dx * dx + dy * dy);
            var m = Math.sqrt(m_sq);
            var v = new cp.Vect(m * dx, m * dy);

            this.masterBall.body.setVel(v);
            this.setRunning(this.masterBall.body.number, true);
        },

        resetTable: function () {
            this.resetBall(this.masterBall, cc.p(MASTER_INITIAL_POS[0], MASTER_INITIAL_POS[1]));

            for (var i = 0, len = this.balls.length; i < len; i ++) {
                var x = BALL_INITIAL_POS[0] + BALLS_INITIAL_REL_POS[i][0];
                var y = BALL_INITIAL_POS[1] + BALLS_INITIAL_REL_POS[i][1];
                this.resetBall(this.balls[i], cc.p(x, y));
            }

            this.goalBallsNumber = [];
            this.setStatus(STATUS_RUNNING);
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
                if (!this.runningBit) {
                    this.setStatus(STATUS_WAIT);
                }
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
            } else if (status === STATUS_WAIT) {
                cc.eventManager.dispatchCustomEvent('table:status_wait');
                if (this.space.locked) {
                    this.space.addPostStepCallback(function () {
                        this.checkOneTurn();
                    }.bind(this));
                } else {
                    this.checkOneTurn();
                }
            } else if (status === STATUS_CLEAR) {
                cc.eventManager.dispatchCustomEvent('table:status_clear');
            }
        },

        // 一轮运动结束后的各种检查（母球落袋、是否全清）
        checkOneTurn: function () {
            var i, len;
            if (this.isMasterGoal) {
                cc.eventManager.dispatchCustomEvent('table:master_goal');
                for (i = 0, len = this.goalBallsNumberOneTurn.length; i < len; i ++) {
                    this.resetBall(this.balls[this.goalBallsNumberOneTurn[i]], cc.p(BALL_INITIAL_POS[0], BALL_INITIAL_POS[1]));
                    this.goalBallsNumber.pop();
                }
                this.resetBall(this.masterBall, cc.p(MASTER_INITIAL_POS[0], MASTER_INITIAL_POS[1]));
            } else {
                if (this.goalBallsNumberOneTurn.length > 0) {
                    cc.eventManager.dispatchCustomEvent('table:goal', this.goalBallsNumberOneTurn);
                    if (this.ballCount <= 1) {
                        this.setStatus(STATUS_CLEAR);
                    }
                } else {
                    cc.eventManager.dispatchCustomEvent('table:no_goal');
                }
            }

            // reset
            this.isMasterGoal = false;
            this.goalBallsNumberOneTurn = [];
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
                }
            }
        }
    });
});