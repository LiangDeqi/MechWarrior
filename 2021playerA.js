window.playerA = new (class PlayerControl {
  // A 选手   B 选手
  constructor(type) {
    this.type = type;
    this.#moveEv = new CustomEvent("keydown");
    this.#fireEv = new CustomEvent("keydown");
    this.firetimestamp = (new Date()).valueOf()
    this.priority = this.#DIRECTION.STOP;
    this.BULLET_WIDTH = 10;
    this.TANK_WIDTH = 50;
    this.shouldFire = false;
    this.enemyTanks = aTankCount;
    this.enemyBullets = aBulletCount;
    this.myTank = null;
    this.anotherTank = null;
  }
  // 方向的别名
  #DIRECTION = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3,
    STOP: 4, //无子弹
    BLOCK: 5, //阻挡
    BORDER: 6 //边界
  };
  // 开火事件
  #fireEv;
  // 移动事件
  #moveEv;

  #playerCode = 'A';

  land() {

    if (this.shouldFire) {

      var c = (new Date()).valueOf()
      if (c - this.firetimestamp > 200) {
        this.firetimestamp = c;
        this.#fire();
        this.shouldFire = false;
      }
    }

    // 当前的坦克实例
    var cur = undefined;
    var enr = undefined;
    aMyTankCount.forEach(element => {
      var c = element;
      if(c['id'] == 100) {
        cur = c;
      }
      if(c['id'] == 200) {
        enr = c;
      }
    });
    const currentTank = cur;
    const enemyTank = enr;
    if (!currentTank) return;

    //下面是方便读取的全局数据的别名
    // 所有的地方坦克实例数组
    const enemyTanks = aTankCount;
    // 所有的敌方子弹实例数组
    const enemyBullets = aBulletCount;
    // 坦克的宽高
    const currentTankWH = 50;
    // 子弹的宽高
    const bulletWH = 10;
    // 坦克的x,y  ===> 坦克中心点
    const currentTankX = currentTank.X;
    const currentTankY = currentTank.Y;
    const currentTankDirect = currentTank.direction
    //我方子弹
    const myBullets = this.type === "A" ? aMyBulletCount1 : aMyBulletCount2;

    // 敌方子弹
    const eBullets = this.type === "A" ? aMyBulletCount2 : aMyBulletCount1;
    // 游戏限制的子弹数为5 = aMyBulletCount2
    const myBulletLimit = 5;

    // 当前策略移动方向
    let moveDirection = undefined

    // 子弹的最大距离 ？
    this.MAX_DISTANCE = (canvas.width + canvas.height)*2;

    this.allEnemyTank.push.apply(this.allEnemyTank, aTankCount);
    if (enemyTank != undefined) {
      this.allEnemyTank.push(enemyTank);
    }
    
    // 中央逃逸点
    const cx = canvas.width/2;
    const cy = canvas.height/2

    function mybullet(X = 0, Y = 0){
      this.direction = 4;//子弹方向
      this.X = X;//子弹坐标
      this.Y = Y;
    }

    // 躲AI子弹
    let Bullet = new Array(new mybullet(), new mybullet(),new mybullet(),
      new mybullet(), new mybullet(), new mybullet(), new mybullet(), new mybullet(), 
      new mybullet(), new mybullet(), new mybullet(), new mybullet(), new mybullet(),
      new mybullet(), new mybullet(), new mybullet(), new mybullet(), new mybullet(),
      new mybullet(),new mybullet(), new mybullet(),);
    let Collide = new Array(this.#DIRECTION.STOP, this.#DIRECTION.STOP, this.#DIRECTION.STOP,
      this.#DIRECTION.STOP, this.#DIRECTION.STOP, this.#DIRECTION.STOP, this.#DIRECTION.STOP, this.#DIRECTION.STOP, 
      this.#DIRECTION.STOP, this.#DIRECTION.STOP, this.#DIRECTION.STOP, this.#DIRECTION.STOP, this.#DIRECTION.STOP,
      this.#DIRECTION.STOP, this.#DIRECTION.STOP, this.#DIRECTION.STOP, this.#DIRECTION.STOP, this.#DIRECTION.STOP,
      this.#DIRECTION.STOP,this.#DIRECTION.STOP, this.#DIRECTION.STOP,)
    this.#calcBulletDistance(enemyBullets, currentTankX, currentTankY, Bullet, currentTankWH, bulletWH,currentTankDirect,Collide)
    this.#calcBulletDistance(eBullets, currentTankX, currentTankY, Bullet, currentTankWH, bulletWH,currentTankDirect,Collide)
    //moveDirection = this.#avoidBullet(currentTankX, currentTankY, currentTankWH, Bullet, moveDirection)

    var lateEnemy = undefined
    var misDistanceOfEnemy = 100 * currentTankWH
    var secruitylevel = enemyTanks.length
    var escapedir = 5
    var firedirectdis = escapedir - 1
    var fight = escapedir + 1
    var secruitydistance = currentTankWH * fight
    var escapenum = 0

    for (const enemy of enemyTanks) {
      const dis = this.#calcTwoPointDistance(
        currentTankX,
        currentTankY,
          enemy.X,
          enemy.Y 
      );

      if(secruitydistance>dis  && secruitylevel >= 4)
      {
        escapenum++//逃亡系数，大了就要跑
      }
      if (misDistanceOfEnemy > dis) {
        misDistanceOfEnemy = dis;
        lateEnemy = enemy;
      }
    }
    if(undefined != enemyTank)
    {
      const enemydis = this.#calcTwoPointDistance(
        currentTankX,
        currentTankY,
        enemyTank.X,
        enemyTank.Y 
      );
      if (enemydis<misDistanceOfEnemy && secruitylevel<=0)
      {
        lateEnemy = enemyTank;

        escapedir = 1
        firedirectdis = escapedir-1
        fight = escapedir + 1
      }
    }
    if(secruitylevel<=2 && undefined != enemyTank)//是否可以加速打电脑
    {
        escapedir = 3
        firedirectdis = escapedir -1
        fight = escapedir + 1
    }
    
    moveDirection = this.#avoidBullet(currentTankX, currentTankY, currentTankWH, Bullet, moveDirection,Collide,currentTankDirect,bulletWH)
    if (undefined != moveDirection) {
      console.log(moveDirection)
    }
    {
      var testbaseUP    = this.#DIRECTION.RIGHT != Bullet[3].direction  && this.#DIRECTION.RIGHT != Bullet[4].direction && this.#DIRECTION.STOP == Bullet[5].direction && this.#DIRECTION.LEFT != Bullet[6].direction && this.#DIRECTION.LEFT != Bullet[7].direction && this.#DIRECTION.DOWN != Bullet[1].direction
      var testbaseDOWN  = this.#DIRECTION.LEFT != Bullet[16].direction && this.#DIRECTION.LEFT != Bullet[17].direction && this.#DIRECTION.STOP == Bullet[15].direction && this.#DIRECTION.RIGHT != Bullet[13].direction && this.#DIRECTION.RIGHT != Bullet[14].direction && this.#DIRECTION.UP != Bullet[19].direction
      var testbaseLEFT  = this.#DIRECTION.DOWN != Bullet[4].direction && this.#DIRECTION.DOWN != Bullet[0].direction && this.#DIRECTION.UP != Bullet[14].direction &&  this.#DIRECTION.UP != Bullet[18].direction && this.#DIRECTION.RIGHT != Bullet[8].direction && this.#DIRECTION.STOP == Bullet[9].direction 
      var testbaseRIGHT = this.#DIRECTION.DOWN != Bullet[6].direction &&  this.#DIRECTION.DOWN != Bullet[2].direction && this.#DIRECTION.STOP == Bullet[11].direction && this.#DIRECTION.LEFT != Bullet[12].direction && this.#DIRECTION.UP != Bullet[16].direction && this.#DIRECTION.UP != Bullet[20].direction
      var testUP    = testbaseUP &&  this.#DIRECTION.STOP == Collide[5]
      var testDOWN  = testbaseDOWN &&  this.#DIRECTION.STOP == Collide[15]
      var testLEFT  = testbaseLEFT &&  this.#DIRECTION.STOP == Collide[9]
      var testRIGHT = testbaseRIGHT &&  this.#DIRECTION.STOP == Collide[11]


      if (undefined != lateEnemy) {
        var disX = Math.abs(lateEnemy.X - currentTankX)
        var disY = Math.abs(lateEnemy.Y - currentTankY)
        var dis = this.#calcTwoPointDistance(currentTankX, currentTankY, lateEnemy.X, lateEnemy.Y)


        var dx = currentTankX - lateEnemy.X;
        var dy = currentTankY - lateEnemy.Y;
        if (disX <= this.DANGER_DISTANCE && disY <= this.DANGER_DISTANCE) {
          moveDirection = this.#escape(currentTank, dx, dy);
        } else if (this.#inFireArea(disX, disY)) {
          moveDirection = this.#stopAndFire(currentTank, dx, dy)
        } else {
          moveDirection = this.#findBestFireArea(currentTank, lateEnemy)
        }

        switch(moveDirection) {
          case this.#DIRECTION.UP: {
            if (!testUP) {
              moveDirection = this.#DIRECTION.STOP;
            }
            break;
          }
          case this.#DIRECTION.DOWN: {
            if (!testDOWN) {
              moveDirection = this.#DIRECTION.STOP;
            }
            break;
          }
          case this.#DIRECTION.LEFT: {
            if (!testLEFT) {
              moveDirection = this.#DIRECTION.STOP;
            }
            break;
          }
          case this.#DIRECTION.RIGHT: {
            if (!testRIGHT) {
              moveDirection = this.#DIRECTION.STOP;
            }
            break;
          }
        }
      }
    }
    moveDirection = this.#avoidBullet(currentTankX, currentTankY, currentTankWH, Bullet, moveDirection,Collide,currentTankDirect,bulletWH)
    this.#move(moveDirection);

    if (this.#shouldFireOnDirection(currentTank, moveDirection)) {
      this.shouldFire = true;
    }

    this.#setName();
  }

  leave() {
    this.#setName();
    document.onkeyup(this.#moveEv);
    document.onkeyup(this.#fireEv);
    this.allEnemyTank = [];
  }
  type;
  // private


  #shouldFireOnDirection(currentTank, direction) {
    for(let i=0;i<this.allEnemyTank.length;i++) {
      let enemy = this.allEnemyTank[i];
      switch (direction) {
          case this.#DIRECTION.UP:
              if (Math.abs(currentTank.X - enemy.X) < this.MIN_FIRE_OFFSET && enemy.Y < currentTank.Y) {
                  return true;
              }
              break;
          case this.#DIRECTION.RIGHT:
              if (Math.abs(currentTank.Y - enemy.Y) < this.MIN_FIRE_OFFSET && enemy.X > currentTank.X) {
                return true;
              }
              break;
          case this.#DIRECTION.DOWN:
              if (Math.abs(currentTank.X - enemy.X) < this.MIN_FIRE_OFFSET && enemy.Y > currentTank.Y) {
                return true;
              }
              break;
          case this.#DIRECTION.LEFT:
              if (Math.abs(currentTank.Y - enemy.Y) < this.MIN_FIRE_OFFSET && enemy.X < currentTank.X) {
                return true;              
              }
              break;
      }
    }
    return false;
  }

  #findBestFireArea(currentTank, targetTank) {
    let targetTankCenter = {X:targetTank.X, Y:targetTank.Y};
    let point1 = {X:targetTankCenter.X - this.BEST_FIRE_DISTANCE, Y:targetTankCenter.Y};
    let point2 = {X:targetTankCenter.X, Y:targetTankCenter.Y - this.BEST_FIRE_DISTANCE};
    let point3 = {X:targetTankCenter.X + this.BEST_FIRE_DISTANCE, Y:targetTankCenter.Y};
    let point4 = {X:targetTankCenter.X, Y:targetTankCenter.Y + this.BEST_FIRE_DISTANCE};
    let points = [point1, point2, point3, point4];
    let highestScore = -this.MAX_DISTANCE;
    let nearestPoint;
    // 寻找出最优的点，并不一定是最近的，如果有多个点可用，则使用更靠近中间的点

    for(let i=0;i<points.length;i++) {
        // 找出4个点中不被遮挡且距离最近的点
        let point = points[i];
        if (point.X < 0 || point.Y < 0 || point.X > canvas.width-tankWidth || point.Y > canvas.height-tankWidth) {
            // 此点在屏幕外，不要
            continue;
        }

        // 找到距离最近的点
        var tempDis = this.#calcTwoPointDistance(currentTank.X, currentTank.Y, point.X, point.Y);

        // console.log("position and score: ", point.X, point.Y, score)

        if (-tempDis > highestScore) {
            highestScore = -tempDis;
            nearestPoint = point;
        }
    }
    // 向nearestPoint移动
    return this.#move2Point(currentTank, targetTank, nearestPoint);
  }

  #move2Point(currentTank, targetTank, targetPoint) {

    let recommendDirection;
    let dx = currentTank.X - targetPoint.X;
    let dy = currentTank.Y - targetPoint.Y;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        // 我方坦克在目标点右边
        recommendDirection = this.#DIRECTION.LEFT;
      } else {
        recommendDirection = this.#DIRECTION.RIGHT;
      }
    } else {
      if (dy > 0) {
        // 我方在目标点下方
        recommendDirection = this.#DIRECTION.UP;
      } else {
        recommendDirection = this.#DIRECTION.DOWN;
      }
    }
    
    return recommendDirection;

  }

  #stopAndFire(currentTank, dx, dy) {
    // 攻击区域，停止并攻击 要考虑方向
    let absDX = Math.abs(dx);
    let absDy = Math.abs(dy);
    if (absDX > absDy) {
        if (dx > 0) {
            // 我方在右边
            if (currentTank.direction === this.#DIRECTION.LEFT) {
                return this.#DIRECTION.STOP;
            } else {
                return this.#DIRECTION.LEFT;
            }
        } else {
            // 我方在左边
            if (currentTank.direction === this.#DIRECTION.RIGHT) {
                return this.#DIRECTION.STOP;
            } else {
                return this.#DIRECTION.RIGHT;
            }
        }
    } else {
        if (dy > 0) {
            if (currentTank.direction === this.#DIRECTION.UP) {
                return this.#DIRECTION.STOP;
            } else {
                return this.#DIRECTION.UP;
            }
        } else {
            if (currentTank.direction === this.#DIRECTION.DOWN) {
                return this.#DIRECTION.STOP;
            } else {
                return this.#DIRECTION.DOWN;
            }
        }
    }
  }


  #inFireArea(absDx, absDy) {
    if ((absDx<this.MIN_FIRE_OFFSET && absDy>=this.DANGER_DISTANCE && absDy <= this.FIRE_MAX_DISTANCE)
        || (absDy<this.MIN_FIRE_OFFSET && absDx>=this.DANGER_DISTANCE && absDx <= this.FIRE_MAX_DISTANCE)) {
        return true;
    }
    return false;
  }

  #escape(currentTank, dx, dy) {
    let direction = this.#DIRECTION.STOP;
    let absDx = Math.abs(dx);
    let absDy = Math.abs(dy);
    if (absDy < absDx) {
        // this.log("distanceHor : " + distanceHor)
        if (absDy <= this.DANGER_DISTANCE) {
            // 小于安全距离，远离
            if (dy > 0) {
                if (currentTank.Y >= canvas.height-this.DANGER_DISTANCE) {
                    if (dx > 0) {
                        direction = this.#DIRECTION.RIGHT;
                    } else {
                        direction = this.#DIRECTION.LEFT;
                    }
                } else {
                    // 同方向往下逃
                    direction = this.#DIRECTION.DOWN;
                }

            } else {
                if (currentTank.Y <= this.DANGER_DISTANCE) {
                    if (dx > 0) {
                        direction = this.#DIRECTION.RIGHT;
                    } else {
                        direction = this.#DIRECTION.LEFT;
                    }
                } else {
                    // 同方向往上逃
                    direction = this.#DIRECTION.UP;
                }
            }

        } else {
            // 不会出现
        }
    } else {
        // this.log("distanceVer : " + distanceVer)
        if (absDx <= this.DANGER_DISTANCE) {
            // 小于安全距离，远离
            // 如果靠近边界，转向离开， 否则同向远离
            if (dx > 0) {
                // 往右跑
                // 如果靠近边界，转向离开， 否则同向远离
                if (currentTank.X >= canvas.width-this.DANGER_DISTANCE) {
                    if (dy > 0) {
                        direction = this.#DIRECTION.DOWN;
                    } else {
                        direction = this.#DIRECTION.UP;
                    }
                } else {
                    direction = this.#DIRECTION.RIGHT;
                }
            } else {
                // 往左跑，如果
                if (currentTank.X <= this.DANGER_DISTANCE) {
                    if (dy > 0) {
                        direction = this.#DIRECTION.DOWN;
                    } else {
                        direction = this.#DIRECTION.UP;
                    }
                } else {
                    direction = this.#DIRECTION.LEFT;
                }
            }
        } else {
            // 不会出现
        }
    }

    return direction;
  }
 
  // 根据玩家返回正确的方向keyCode
  #getDirectionKeyCode(direction) {
    switch (direction) {
      case this.#DIRECTION.UP:
        return this.type === "A" ? 87 : 38;
      case this.#DIRECTION.DOWN:
        return this.type === "A" ? 83 : 40;
      case this.#DIRECTION.LEFT:
        return this.type === "A" ? 65 : 37;
      case this.#DIRECTION.RIGHT:
        return this.type === "A" ? 68 : 39;
    }
  }
  // 设置队伍
  #setName() {
    document.getElementById(
      `Player${this.type === "A" ? 1 : 2}barName`
    ).value = "ldq"
    document.getElementById(
      `Player${this.type === "A" ? 1 : 2}Name`
    ).textContent = "ldq"
  }
  // 控制移动   举例子：  向左移动： this.#move(this.#DIRECTION.LEFT)
  #move(direction) {
    if (direction == undefined) return;
    this.#moveEv.keyCode = this.#getDirectionKeyCode(direction);
    console.log("移动", direction)
    document.onkeydown(this.#moveEv);
  }
  // 开火
  #fire(direction) {
    this.#fireEv.keyCode = this.type === "A" ? 32 : 8;
    document.onkeydown(this.#fireEv);
  }
  
})("A");