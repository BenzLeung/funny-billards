/**
 * @file 台球桌
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/2/20
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

define(['cocos', 'chipmunk', 'sprites/ball'], function (cc, cp, Ball) {
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
        cc.p(64, 64),
        // 左上袋
        cc.p(64, 713),
        // 右下袋
        cc.p(1338, 64),
        // 右上袋
        cc.p(1338, 713),
        // 下中袋
        cc.p(701, 46),
        // 上中袋
        cc.p(701, 731)
    ];

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
            for (i = 0; i < POCKET_POS; i ++) {
                v = POCKET_POS[i];
                t = v.x;
                v.x = v.y;
                v.y = t;
            }
        })();
    }

    return cc.Layer.extend({

        ctor : function () {
            this._super();

            var winSize = cc.director.getWinSize();

            this.setContentSize(TABLE_WIDTH, TABLE_HEIGHT);
            this.ignoreAnchorPointForPosition(false);
            this.setAnchorPoint(0.5, 0.5);
            this.setPosition(winSize.width / 2, winSize.height / 2);

            this.space = new cp.Space();
            this.initSpace();

            this.initMouse();
            if (cc.sys.capabilities['touches']) {
                this.initTouch();
            }

            this.scheduleUpdate();

            this.masterBallOriginPos = cc.p(TABLE_WIDTH * 3 / 4, TABLE_HEIGHT / 2);
            if (cc.sys.isMobile) {
                this.masterBallOriginPos = cc.p(TABLE_WIDTH / 2, TABLE_HEIGHT / 4);
            }
            this.masterBall = this.addBall(this.masterBallOriginPos, cp.vzero, 'res/masterball.png');

            var me = this;
            var t = setInterval(function () {
                me.addBall(cc.p(352, 388), cp.v(cc.random0To1() * 500, cc.random0To1() * 500));
            }, 1000);
            setTimeout(function () {
                clearInterval(t);
            }, 10010);
        },

        initSpace : function () {
            var i;
            var wall;

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
            for(i=0; i < WALL_POLYGONS.length; i++ ) {
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

            // todo: 创建袋口


            // 调试显示
            this._debugNode = new cc.PhysicsDebugNode(this.space);
            this.addChild(this._debugNode);
        },

        fixEventPosition: function (evt_pos) {
            var pos = this.getPosition();
            var anchor = this.getAnchorPoint();
            var size = this.getContentSize();
            var fixPos = cc.p(
                pos.x - size.width * anchor.x,
                pos.y - size.height * anchor.y
            );
            evt_pos.x -= fixPos.x;
            evt_pos.y -= fixPos.y;
            return evt_pos;
        },

        initMouse: function () {
            var me = this;
            var mouseListener = cc.EventListener.create({
                event: cc.EventListener.MOUSE,
                onMouseUp: function (event) {
                    if (event.getButton() == cc.EventMouse.BUTTON_LEFT) {
                        me.shootMasterBall(me.fixEventPosition(event.getLocation()));
                    }
                }
            });
            cc.eventManager.addListener(mouseListener, this);
        },

        initTouch: function () {
            var me = this;
            var touchListener = cc.EventListener.create({
                event: cc.EventListener.TOUCH_ONE_BY_ONE,
                onTouchBegan: function (event) {
                    me.shootMasterBall(me.fixEventPosition(event.getLocation()));
                }
            });
            cc.eventManager.addListener(touchListener, this);
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
                return false;
            }

            /*/////////////
             (i*x)^2 + (i*y)^2 = F^2
             ->  i^2 * x^2 + i^2 * y^2 = F^2
             ->  i^2 * (x^2 + y^2) = F^2
             ->  i^2 = F^2 / (x^2 + y^2)
             /////////////*/
            var m_sq = MOVE_FRICTION_SQ / (vx * vx + vy * vy);
            var m = Math.sqrt(m_sq);

            if (m > 1) {
                ballBody.vx = 0;
                ballBody.vy = 0;
            } else {
                ballBody.vx = vx - m * vx;
                ballBody.vy = vy - m * vy;
            }

            if (Math.abs(w) > ROTATE_FRICTION) {
                if (w > 0) {
                    ballBody.w -= ROTATE_FRICTION;
                } else {
                    ballBody.w += ROTATE_FRICTION;
                }
            } else {
                ballBody.w = 0;
            }

            return false;
        },

        onEnter: function() {
            this._super();
            this.space.addCollisionHandler(1, 0, null, this.desktopPreSolve, null, null);
        },

        onExit: function() {
            this.space.removeCollisionHandler(1, 0);
            this._super();
        },

        addBall: function (pos, vel, pngName) {
            pngName = pngName || 'res/ball.png';
            var sprite = new Ball(pngName);
            sprite.setPosition(pos);
            sprite.body.setVel(vel);
            this.space.addBody(sprite.body);
            this.space.addShape(sprite.shape);
            this.addChild(sprite);

            return sprite;
        },

        shootMasterBall: function (pos) {
            var curPos = this.masterBall.getPosition();
            var dx = pos.x - curPos.x;
            var dy = pos.y - curPos.y;
            if (dx === 0 && dy === 0) {
                return;
            }

            var m_sq = SHOOT_MAX_SPEED * SHOOT_MAX_SPEED / (dx * dx + dy * dy);
            var m = Math.sqrt(m_sq);
            var v = new cp.Vect(m * dx, m * dy);

            this.masterBall.body.setVel(v);
        },

        update: function (dt) {
            this._super(dt);
            // chipmunk step
            var l = Math.round(60 / (1 / dt));
            if (l < 1) {
                l = 1;
            }
            for (var i = 0; i < l; i ++) {
                this.space.step(1 / 60);
            }
        }
    });
});