/**
 * @file 游戏开始菜单
 * @author BenzLeung(https://github.com/BenzLeung)
 * @date 2017/3/5
 * @class StartMenu
 * Created by JetBrains PhpStorm.
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

define(
    [
        'cocos',
        'scenes/gameScene',
        'scenes/languageScene',
        'scenes/aboutScene',
        'benzAudioEngine',
        'i18n/i18n'
    ],
    function (cc, GameScene, LanguageScene, AboutScene, benzAudioEngine, i18n) {

        var RES = {
            gameScene: [
                'res/masterball.png',
                'res/ball-animate-sprite.png',
                'res/table.png',
                'res/fingers.png',

                'res/slider-background.png',
                'res/slider-progress.png',
                'res/slider-thumb.png',

                'res/btn-menu.png',

                'res/btn-force.png',
                'res/btn-force-disabled.png',

                'res/btn-shoot.png',
                'res/btn-shoot-disabled.png',

                'res/qrcode.png'
            ]
        };

        var SOUND = {
            gameScene: [
                'res/goal.mp3',
                'res/hit-ball.mp3',
                'res/hit-wall.mp3',
                'res/lost-master.mp3',
                'res/shoot.mp3',
                'res/bgm.mp3',
                'res/clear.mp3'
            ]
        };

        return cc.Menu.extend({
            ctor : function () {
                var MENU_FONT_SIZE = cc.sys.isMobile ? 72 : 50;
                var MENU_COLOR = new cc.Color(0, 255, 0);
                var MENU_DISABLED_COLOR = new cc.Color(128, 128, 128);

                var continueGameLabel = new cc.LabelTTF(i18n('继续游戏'), i18n.defaultFont, MENU_FONT_SIZE);
                continueGameLabel.setColor(MENU_COLOR);
                var continueGameMenuItem = new cc.MenuItemLabel(continueGameLabel, this.doContinueGame, this);
                continueGameMenuItem.setDisabledColor(MENU_DISABLED_COLOR);
                if (!cc.sys.localStorage.getItem('tableState')) {
                    continueGameMenuItem.setEnabled(false);
                }

                var startGameLabel = new cc.LabelTTF(i18n('开始新游戏'), i18n.defaultFont, MENU_FONT_SIZE);
                startGameLabel.setColor(MENU_COLOR);
                var startGameMenuItem = new cc.MenuItemLabel(startGameLabel, this.doStartGame, this);

                var soundLabel = new cc.LabelTTF(i18n('声音：开'), i18n.defaultFont, MENU_FONT_SIZE);
                soundLabel.setColor(MENU_COLOR);
                this.soundMenuItem = new cc.MenuItemLabel(soundLabel, this.doSoundFlag, this);
                this.soundMenuItem.setDisabledColor(MENU_DISABLED_COLOR);
                this.initSoundFlag();

                var languageLabel = new cc.LabelTTF(i18n('语言 (Language)'), i18n.defaultFont, MENU_FONT_SIZE);
                languageLabel.setColor(MENU_COLOR);
                var languageMenuItem = new cc.MenuItemLabel(languageLabel, this.doLanguage, this);

                var aboutLabel = new cc.LabelTTF(i18n('关于'), i18n.defaultFont, MENU_FONT_SIZE);
                aboutLabel.setColor(MENU_COLOR);
                var aboutMenuItem = new cc.MenuItemLabel(aboutLabel, this.doAbout, this);

                this._super(continueGameMenuItem, startGameMenuItem, this.soundMenuItem, languageMenuItem, aboutMenuItem);

                this.setContentSize(cc.visibleRect.width / 2, cc.visibleRect.height * 0.375);
                this.setPosition(cc.visibleRect.width / 2, cc.visibleRect.height * 0.3125);
                this.alignItemsVerticallyWithPadding(15);
            },

            doContinueGame: function () {
                if (!!(this.soundFlag & 1)) {
                    benzAudioEngine.play('res/selected.mp3');
                }
                cc.LoaderScene.preload(RES.gameScene, function () {
                    benzAudioEngine.load(SOUND.gameScene, function () {
                        cc.director.runScene(new GameScene());
                    });
                }, this);
            },

            doStartGame : function () {
                var state = cc.sys.localStorage.getItem('tableState');
                if (state) {
                    if (confirm(i18n('确定要删除游戏进度并开始新游戏吗？'))) {
                        cc.sys.localStorage.removeItem('tableState');
                        this.doContinueGame();
                    }
                } else {
                    this.doContinueGame();
                }
            },

            getSoundFlagText : function () {
                switch (this.soundFlag) {
                    case 0:
                        return i18n('声音：关');
                    case 1:
                        return i18n('声音：仅音效');
                    case 2:
                        return i18n('声音：仅背景音乐');
                    case 3:
                        return i18n('声音：开');
                }
            },

            initSoundFlag : function () {
                var enableBgm = parseInt(cc.sys.localStorage.getItem('enableBgm'), 10);
                var enableSfx = parseInt(cc.sys.localStorage.getItem('enableSfx'), 10);
                if (isNaN(enableBgm)) {
                    enableBgm = 1;
                    cc.sys.localStorage.setItem('enableBgm', 1);
                }
                if (isNaN(enableSfx)) {
                    enableSfx = 1;
                    cc.sys.localStorage.setItem('enableSfx', 1);
                }

                this.soundFlag = enableBgm << 1 | enableSfx;

                if (benzAudioEngine.support()) {
                    this.soundMenuItem.setString(this.getSoundFlagText());
                } else {
                    this.soundMenuItem.setString(i18n('声音：系统不支持'));
                    this.soundMenuItem.setEnabled(false);
                }
            },

            doSoundFlag : function () {
                this.soundFlag ++;
                this.soundFlag = this.soundFlag & 3;
                var enableBgm = (this.soundFlag & 2) >> 1;
                var enableSfx = this.soundFlag & 1;
                cc.sys.localStorage.setItem('enableBgm', enableBgm);
                cc.sys.localStorage.setItem('enableSfx', enableSfx);

                this.soundMenuItem.setString(this.getSoundFlagText());
                if (this.soundFlag) {
                    benzAudioEngine.play('res/hit-ball.mp3');
                }
            },

            doLanguage : function () {
                cc.director.runScene(new LanguageScene());
            },

            doAbout : function () {
                cc.director.pushScene(new AboutScene());
            }
        });
    }
);
