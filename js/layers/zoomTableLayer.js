/**
 * @file 实现台球桌子用触屏放大缩小的功能
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/2/23
 * @class ZoomTableLayer
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */


define(
    [
        'cocos',
        'layers/tableLayer'
    ],
    function (cc, TableLayer) {
        return cc.Layer.extend({

            tableScale: 1.0,

            tablePos: cc.p(0, 0),

            ctor: function () {
                this._super();
                this.tableLayer = new TableLayer();
                this.tableLayer.ignoreAnchorPointForPosition(false);
                this.tableLayer.setAnchorPoint(0, 0);
                this.addChild(this.tableLayer);

                this.initTouch();
            },

            initTouch: function () {
                var touchListener = cc.EventListener.create({
                    event: cc.EventListener.TOUCH_ALL_AT_ONCE,
                    onTouchesMoved: function (touches, event) {
                        var target = event.getCurrentTarget();
                        var table = target.tableLayer;
                        if (touches.length > 1) {
                            var touch1 = touches[0];
                            var touch2 = touches[1];
                            var pos1 = target.convertToNodeSpace(touch1.getLocation());
                            var pos2 = target.convertToNodeSpace(touch2.getLocation());
                            var prevPos1 = target.convertToNodeSpace(touch1.getPreviousLocation());
                            var prevPos2 = target.convertToNodeSpace(touch2.getPreviousLocation());
                            var dPos1 = touch1.getDelta();
                            var dPos2 = touch2.getDelta();
                            var ancPos = cc.pMidpoint(pos1, pos2);
                            var moveDPos = cc.pMidpoint(dPos1, dPos2);
                            var distance = cc.pDistance(pos1, pos2);
                            var prevDistance = cc.pDistance(prevPos1, prevPos2);
                            var scale = distance / prevDistance;
                            target.moveTableDelta(moveDPos);
                            target.zoomTableDelta(scale, ancPos);
                        } else {
                            if (table.status !== TableLayer.STATUS_READY) return false;
                            var touch = touches[0];
                            var delta = touch.getDelta();
                            var curPos = table.ballCursor.getPosition();
                            var theRect = cc.rect(
                                TableLayer.BALL_RADIUS,
                                TableLayer.BALL_RADIUS,
                                TableLayer.TABLE_WIDTH - TableLayer.BALL_RADIUS,
                                TableLayer.TABLE_HEIGHT - TableLayer.BALL_RADIUS
                            );
                            delta = cc.pMult(delta, 0.5 / target.tableScale);
                            curPos = cc.pAdd(curPos, delta);
                            curPos = cc.pClamp(curPos, cc.p(theRect.x, theRect.y), cc.p(theRect.width, theRect.height));
                            table.setAimLine(curPos);
                            return true;
                        }
                    },
                    onTouchesEnded: function (touches, event) {
                        var target = event.getCurrentTarget();
                        var size = target.getContentSize();
                        if (target.tableScale < 0.5) {
                            target.zoomTable(0.5, cc.p(size.width, size.height), true);
                        }
                        if (target.tableScale > 3.5) {
                            target.zoomTable(3.5, cc.p(size.width, size.height), true);
                        }
                        var clampStart = cc.p(size.width * 0.5, size.height * 0.5);
                        var clampEnd = cc.p(TableLayer.TABLE_WIDTH * target.tableScale, TableLayer.TABLE_HEIGHT * target.tableScale);
                        clampEnd = cc.pSub(clampStart, clampEnd);
                        var clamp = cc.pClamp(target.tablePos, clampEnd, clampStart);
                        if (!cc.pointEqualToPoint(target.tablePos, clamp)) {
                            target.moveTable(clamp, true);
                        }
                    }
                });
                cc.eventManager.setPriority(touchListener, 10);
                cc.eventManager.addListener(touchListener, this);
                this.tableLayer.setAimLine(cc.p(TableLayer.TABLE_WIDTH / 2, TableLayer.TABLE_HEIGHT / 2));

                // 鼠标和触屏的控制光标的方式不一样，因此显示/隐藏光标的逻辑也不一样，于是分别写
                cc.eventManager.addCustomListener('table:status_ready', function () {
                    this.tableLayer.setAimLine(this.tableLayer.ballCursor.getPosition());
                }.bind(this));
                cc.eventManager.addCustomListener('table:status_running', function () {
                    this.tableLayer.hideAimLine();
                }.bind(this));
            },

            zoomTable: function (scale, anchorPos, animate) {
                var tableAncPos = cc.pSub(anchorPos, this.tablePos);
                var scaleAncPos = cc.pMult(tableAncPos, scale / this.tableScale);
                var fixDelta = cc.pSub(tableAncPos, scaleAncPos);
                this.tableScale = scale;

                if (animate) {
                    var newPos = cc.pAdd(this.tablePos, fixDelta);
                    this.moveTable(newPos, true);
                    this.tableLayer.runAction(cc.scaleTo(0.3, scale).easing(cc.easeSineInOut()));
                } else {
                    this.moveTableDelta(fixDelta);
                    this.tableLayer.setScale(scale);
                }
            },

            zoomTableDelta: function (deltaScale, anchorPos) {
                var scale = this.tableScale * deltaScale;
                this.zoomTable(scale, anchorPos);
            },

            moveTable: function (newPos, animate) {
                this.tablePos = newPos;
                if (animate) {
                    this.tableLayer.runAction(cc.moveTo(0.3, newPos).easing(cc.easeSineInOut()));
                } else {
                    this.tableLayer.setPosition(newPos);
                }
            },

            moveTableDelta: function (deltaPos) {
                var newPos = cc.pAdd(this.tablePos, deltaPos);
                this.moveTable(newPos);
            },

            moveAndZoomTable: function (newPos, scale, animate) {
                this.tablePos = newPos;
                this.tableScale = scale;
                if (animate) {
                    this.tableLayer.runAction(cc.moveTo(0.3, newPos).easing(cc.easeExponentialInOut()));
                    this.tableLayer.runAction(cc.scaleTo(0.3, scale).easing(cc.easeExponentialInOut()));
                } else {
                    this.tableLayer.setPosition(newPos);
                    this.tableLayer.setScale(scale);
                }
            },

            resetTable: function (animate) {
                var thisSize = this.getContentSize();
                var fixWidth = (thisSize.width - 50) / TableLayer.TABLE_WIDTH;
                var fixHeight = (thisSize.height - 50) / TableLayer.TABLE_HEIGHT;
                var fixScale = Math.min(fixWidth, fixHeight);
                var newPos = cc.p(
                    (thisSize.width - TableLayer.TABLE_WIDTH * fixScale) / 2,
                    (thisSize.height - TableLayer.TABLE_HEIGHT * fixScale) / 2
                );
                this.moveAndZoomTable(newPos, fixScale, animate);
            },

            onEnter: function () {
                this._super();
                this.resetTable();
            }

        });
    }
);