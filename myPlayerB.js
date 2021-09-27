window.playerB = new (class PlayerControl {
    // 方向的别名
    static DIRECTION = {
        UP: 0,
        RIGHT: 1,
        DOWN: 2,
        LEFT: 3,
        STOP: 4, //无子弹
        BLOCK: 5, //阻挡
        BORDER: 6 //边界
    };

    type; // A玩家或B玩家
    
    #fireEv; // 开火事件
    
    #moveEv; // 移动事件

    #enemyTanks;

    #enemyBullets;

    #myTank;

    #myBullets;

    #anotherTank;

    #anotherBullet;

    #mapWidth;

    #mapHeight;

    #aworld;

    #leftTop = [[], [], [], [], []];
    #leftCenter = [];
    #leftBottom = [[], [], [], [], []];
    #bottomLeft = [[], [], [], [], []];
    #bottomCenter = [];
    #bottomRight = [[], [], [], [], []];
    #rightBottom = [[], [], [], [], []];
    #rightCenter = [];
    #rightTop = [[], [], [], [], []];
    #topRight = [[], [], [], [], []];
    #topCenter = [];
    #topLeft = [[], [], [], [], []];

    constructor(type) {
        this.type = type;
        this.#moveEv = new CustomEvent("keydown");
        this.#fireEv = new CustomEvent("keydown");
        this.#score = 0;  
    }

    #findPlayerTank(aMyTankCount) {
        var tanks = [];
        aMyTankCount.forEach(element => {
            var c = element;
            if (c['id'] == 100) { // playerA id 是 100
                tanks[0] = c;
            }
            if (c['id'] == 200) { // playerB id 是 200
                tanks[1] = c;
            }
        });
        return tanks;
    }

    // 返回方向keyCode
    #getDirectionKeyCode(direction) {
        switch (direction) {
            case 0:
                return this.type === "B" ? 87 : 38;
            case 2:
                return this.type === "B" ? 83 : 40;
            case 3:
                return this.type === "B" ? 65 : 37;
            case 1:
                return this.type === "B" ? 68 : 39;
        }
    }

    // 设置队伍
    #setName() {
        document.getElementById(`Player${this.type === "B" ? 1 : 2}barName`).value = "机甲战士";
        document.getElementById(`Player${this.type === "B" ? 1 : 2}Name`).textContent = "机甲战士";
    }

    // 控制移动 
    #move(direction) {
        if (direction == undefined) return;
        this.#moveEv.keyCode = this.#getDirectionKeyCode(direction);
        console.log("移动", direction)
        document.onkeydown(this.#moveEv);
    }

    // 控制开火
    #fire() {
        this.#fireEv.keyCode = this.type === "B" ? 32 : 8;
        document.onkeydown(this.#fireEv);
    }

    #calculateCollision(coordinateB, coordinateT) {
        var distance = coordinateB - coordinateT;
        // 该距离不会碰撞
        if (distance <= -10 || distance >= 50) {
            return [0, 0];
        }
        // 第一个值表示需要移动的次数，第二个值表示方向：-1:坐标轴逆向;0-正向逆向都可;1:坐标轴正向
        var result = [0, 0];
        if (distance >= -9 && distance <= -3) {
            result = [1, 1];
        } else if (distance >= -2 && distance <= 4) {
            result = [2, 1];
        } else if (distance >= 5 && distance <= 11) {
            result = [3 ,1];
        } else if (distance >= 12 && distance <= 18) {
            result = [4 ,1];
        } else if (distance === 19 ) {
            result = [5 ,1];
        } else if (distance === 20) {
            result = [5 ,0];
        } else if (distance === 21) {
            result = [5 ,-1];
        } else if (distance >= 22 && distance <= 28) {
            result = [4 ,-1];
        } else if (distance >= 29 && distance <= 35) {
            result = [3, -1];
        } else if (distance >= 36 && distance <= 42) {
            result = [2, -1]; 
        } else if (distance >= 43 && distance <= 49) {
            result = [1, -1];
        }
        return result;
    }

    #flushEnemyBullets() {
        this.#leftTop = [[], [], [], [], []];
        this.#leftCenter = [];
        this.#leftBottom = [[], [], [], [], []];
        this.#bottomLeft = [[], [], [], [], []];
        this.#bottomCenter = [];
        this.#bottomRight = [[], [], [], [], []];
        this.#rightBottom = [[], [], [], [], []];
        this.#rightCenter = [];
        this.#rightTop = [[], [], [], [], []];
        this.#topRight = [[], [], [], [], []];
        this.#topCenter = [];
        this.#topLeft = [[], [], [], [], []];
    }

    #analyseEnemyBullets(bullets, tankX, tankY) {
        const aworld = this.#aworld;
        for (let bullet of bullets) {
            if (bullet.direction === 0) { // 子弹朝上飞时
                if (tankY >= bullet.Y + 10) { // 坦克在下
                    continue;
                }
                // 在 X轴 计算碰撞可能
                let collisionX = this.#calculateCollision(bullet.X, tankX);
                
                if (collisionX[0] === 0) { // 没有交集，打不着
                }
                let hasObstacle = false;
                for (let world of aworld) {
                    let diffX = bullet.X - world.X;
                    let diffY = bullet.Y - world.Y;
                    if (diffX <= 50 && diffY > -10 && diffY < 50) {
                        hasObstacle = true;
                        break;
                    }
                }
                if (hasObstacle) {
                    continue; // 有障碍物，打不着
                }
                if (collisionX[1] > 0) { // 坦克下部左侧的子弹
                    // 将这区域的子弹根据距离中轴线的偏移分为5组
                    this.#bottomLeft[collisionX[0] - 1].push(bullet);
                } else if (collisionX[1] === 0) { // 下部中轴
                    this.#bottomCenter.push(bullet);
                } else { // 下部右侧
                    this.#bottomRight[collisionX[0] - 1].push(bullet);
                }

            } else if (bullet.direction === 1) { // 子弹朝右飞时
                if (tankX + 50 <= bullet.X) { // 坦克在左
                    continue;
                }
                // 在 Y轴 计算碰撞可能
                let collisionY = this.#calculateCollision(bullet.Y, tankY);

                if (collisionY[0] === 0) { // 没有交集，打不着
                    continue;
                }
                let hasObstacle = false;
                for (let world of aworld) {
                    let diffX = bullet.X - world.X;
                    let diffY = bullet.Y - world.Y;
                    if (diffY <= 10 && diffX > -10 && diffX < 50) {
                        hasObstacle = true;
                        break;
                    }
                }
                if (hasObstacle) {
                    continue; // 有障碍物，打不着
                }
                if (collisionY[1] > 0) { // 坦克左部上侧的子弹
                    this.#leftTop[collisionY[0] - 1].push(bullet);
                } else if (collisionY[1] === 0) { // 左部中轴
                    this.#leftCenter.push(bullet);
                } else { // 左部上侧
                    this.#leftBottom[collisionY[0] - 1].push(bullet);
                }

            } else if (bullet.direction === 2) { // 子弹朝下飞时
                if (tankY + 50 >= bullet.Y) { // 坦克在上
                    continue; 
                }
                // 在 X轴 计算碰撞可能
                let collisionX = this.#calculateCollision(bullet.X, tankX);
                if (collisionX[0] === 0) { // 不会碰撞
                    continue;
                }
                let hasObstacle = false;
                for (let world of aworld) {
                    let diffX = bullet.X - world.X;
                    let diffY = bullet.Y - world.Y;
                    if (diffX <= -10 && diffY > -10 && diffY < 50) {
                        hasObstacle = true;
                        break;
                    }
                }
                if (hasObstacle) {
                    continue; // 有障碍物，打不着
                }
                if (collisionX[1] > 0) { // 坦克上部左侧的子弹
                    this.#topLeft[collisionX[0] - 1].push(bullet);
                } else if (collisionX[1] === 0) { // 上部中轴
                    this.#topCenter.push(bullet);
                } else { // 上部右侧
                    this.#topRight[collisionX[0] - 1].push(bullet);
                }

            } else if (bullet.direction === 3) { // 子弹朝左飞时
                if (tankX >= bullet.X + 10) { // 坦克在右
                    continue;
                }
                let collisionY = this.#calculateCollision(bullet.Y, tankY);
                if (collisionY[0] === 0) {
                    continue;
                }
                let hasObstacle = false;
                for (let world of aworld) {
                    let diffX = bullet.X - world.X;
                    let diffY = bullet.Y - world.Y;
                    if (diffY >= 500 && diffX > -10 && diffX < 50) {
                        hasObstacle = true;
                        break;
                    }
                }
                if (hasObstacle) {
                    continue; // 有障碍物，打不着
                }
                if (collisionY[1] > 0) { // 坦克右部上侧的子弹
                    this.#rightTop[collisionY[0] - 1].push(bullet);
                } else if (collisionY[1] === 0) { // 右部中轴
                    this.#rightCenter.push(bullet);
                } else { // 右部上侧
                    this.#rightBottom[collisionY[0] - 1].push(bullet);
                }
            
            }
        }
    }

    #calculateScoresIn12Sectors() {
        let scores = [];
        // 左上角
        scores[0] = this.#getScoresNotCenter(this.#leftTop);
        // 左中轴
        scores[1] = this.#getScoresCenter(this.#leftCenter);
        // 左下角
        scores[2] = this.#getScoresNotCenter(this.#leftBottom);
        // 下左角
        scores[3] = this.#getScoresNotCenter(this.#bottomLeft);
        // 下中轴
        scores[4] = this.#getScoresCenter(this.#bottomCenter);
        // 下右角
        scores[5] = this.#getScoresNotCenter(this.#bottomRight);

        // 右下角
        scores[6] = this.#getScoresNotCenter(this.#rightBottom);
        // 右中轴
        scores[7] = this.#getScoresCenter(this.#rightCenter);
        // 右上角
        scores[8] = this.#getScoresNotCenter(this.#rightTop);
        // 上右角
        scores[9] = this.#getScoresNotCenter(this.#topRight);
        // 上中轴
        scores[10] = this.#getScoresCenter(this.#topCenter);
        // 上左角
        scores[11] = this.#getScoresNotCenter(this.#topLeft);
        return scores;
    }

    #getScoresNotCenter(bullets) {
        let sectorScores = [];
        for (let i = 0; i < bullets; i++) {
            const n = i + 1;
            if (bullets.length === 0) {
                sectorScores[i] = 10000 / (10 * n);
            } else {
                let minDistance = Infinity;
                for (let bullet of bullets) {
                    let distance = this.#myTank.X - (bullet.X + 10);
                    if (distance < minDistance) {
                        minDistance = distance;
                    }
                }
                let score = minDistance / (10 * n); // 分数是子弹距离与安全距离的比值
                sectorScores[i] = score;
            }
        }
        return sectorScores;
    }

    #getScoresCenter(bullets) {
        let centerScore = Infinity;
        if (bullets.length === 0) {
            return centerScore;
        } else {
            let minDistance = Infinity;
            for (let bullet of bullets) {
                let distance = this.#myTank.X - (bullet.X + 10);
                if (distance < minDistance) {
                    minDistance = distance;
                }
            }
            centerScore = minDistance / 50;
        }
        return centerScore;
    }

    #getNextMove() {
        if (this.#myTank === null || this.#myTank === undefined) {
            return;
        }
        const myTank = this.#myTank;
        const bullets = this.#enemyBullets !== undefined ? this.#enemyBullets : [];
        const tankX = myTank.X;
        const tankY = myTank.Y;
        this.#flushEnemyBullets();
        if (this.#enemyTanks === undefined || this.#enemyTanks.length === 0) { // 所有AI坦克被消灭，躲避对手的子弹
            bullets.push(this.#anotherBullet);
        }
        const tankX = this.#myTank.X;
        const tankY = this.#myTank.Y;
        this.#analyseEnemyBullets(bullets, tankX, tankY);
        let scores = this.#calculateScoresIn12Sectors();
        if (this.#shouldFire(this.#myTank.direction) < 10000) {
            this.#fire();
        }
        let directions = this.#avoidBullets(scores);
        let deadDirections = directions[0];
        let redDirections = directions[1];
        let yellowDirections = directions[2];
        
        let finalDirection = 4;
        if (redDirections.length === 0) {
            let targetDirections = this.#findDirectionByTarget();
            for (let targetDirection of targetDirections) {
                switch (targetDirection) {
                    case 0: // 👆
                        
                }
            }
            
        } else if (directions.length === 1) {
            finalDirection = directions[0];
        } else if (directions.length >= 2) {
            let tmpDirection = this.#findDirectionByTarget();
            let directionSet = new Set(directions);
            if (directionSet.has(tmpDirection)) {
                finalDirection = tmpDirection;
            } else {
                finalDirection = directions[0];
            }
        }
        if (this.#shouldFire(finalDirection) < 10000) {
            this.#fire();
        }
        this.#move(finalDirection);
    }

    #shouldFire(direction) {
        const tankDirection = direction;
        const myTank = this.#myTank;
        const enemies = this.#enemyTanks;
        let targetDistance = 10000;
        if (tankDirection === 0) {
            for (let enemy of enemies) {
                if (enemy.X > myTank.X - 25 && enemy.X < myTank.X + 5 && enemy.Y <= myTank.Y + 50) {
                    let d = myTank.Y - (enemy.Y + 50);
                    if (d < targetDistance) {
                        targetDistance = d;
                    }
                }
            }
        } else if (tankDirection === 1) {
            for (let enemy of enemies) {
                if (enemy.Y > myTank.Y - 25 && enemy,Y < myTank.Y + 5 && enemy.X + 50 <= myTank.X) {
                    let d = enemy.X - (myTank.X + 50);
                    if ( d < targetDistance) {
                        targetDistance = d;
                    }
                }
            }
        } else if (tankDirection === 2) {
            for (let enemy of enemies) {
                if (enemy.X > myTank.X - 25 && enemy.X < myTank.X + 5 && myTank.Y + 50 <= enemy.Y) {
                    let d = enemy.Y - (myTank.Y + 50);
                    if ( d < targetDistance) {
                        targetDistance = d;
                    }
                }
            }
        } else if (tankDirection === 3) {
            for (let enemy of enemies) {
                if (enemy.Y > myTank.Y - 25 && enemy,Y < myTank.Y + 5 && enemy.X + 50 <= myTank.X) {
                    let d = myTank.X - (enemy.X + 50);
                    if ( d < targetDistance) {
                        targetDistance = d;
                    }
                }
            }
        }
        return targetDistance;
    }

    #avoidBullets(scores) {
        let deadAlerts = []; // 躲不开的
        let redAlerts = []; // 优先躲避
        let yellowAlerts = []; // 次优先躲避
        let blueAlerts = []; // 次次级躲避
        let greenAlerts = []; // 可以不躲避
        for (let i = 0; i < 12; i++) {
            if (i === 1 || i === 4 || i === 7 || i === 10) {
                if (scores[i] < 1) {
                    deadAlerts.push(i);
                } else if (scores[i] >= 1 && scores[i] < 2) {
                    redAlerts.push(i);
                } else if (scores[i] >= 2 && scores[i] < 3) {
                    yellowAlerts.push(i);
                } else if (scores[i] >= 3 && scores[i] < 4) {
                    blueAlerts.push(i);
                } else {
                    greenAlerts.push(i);
                }
            }  else {
                let minScore = Infinity;
                for (let j = 0; j < scores[i].length; j++) { // 非中轴线上的找该区域内最小的
                    if (scores[i][j] < minScore) {
                        minScore = scores[i][j];
                    }
                }
                if (minScore[i] < 1) {
                    deadAlerts.push(i);
                } else if (minScore < 2) { // 小于2必须躲避
                    redAlerts.push(i);
                } else if (minScore >= 2 && minScore < 3) {
                    yellowAlerts.push(i);
                } else if (minScore >= 3 && minScore < 4) {
                    blueAlerts.push(i);
                } else {
                    greenAlerts.push(i);
                }
            }
        }
        let reservedDirections = [];
        reservedDirections[0] = this.#findDirectionBySectorScores(deadAlerts);
        reservedDirections[1] = this.#findDirectionBySectorScores(redAlerts);
        reservedDirections[2] = this.#findDirectionBySectorScores(yellowAlerts);
        reservedDirections[3] = this.#findDirectionBySectorScores(blueAlerts);
        reservedDirections[4] = this.#findDirectionBySectorScores(greenAlerts);
        return reservedDirections;
    }

    #findDirectionBySectorScores(alerts) {
        if (alerts.length === 0) {
            return [];
        } 
        let directions = new Set();
        for (let i = 0; i < alerts.length; i++) {
            if (alerts[i] === 1 || alerts[i] === 7) {
                directions.add(0);
                directions.add(2);
            } else if (alerts[i] === 4 || alerts[i] === 10) {
                directions.add(1);
                directions.add(3);
            } else if (alerts[i] === 0 || alerts[i] === 8) {
                directions.add(2);
            } else if (alerts[i] === 2 || alerts[i] === 6) {
                directions.add(0);
            } else if (alerts[i] === 3 || alerts[i] === 11) {
                directions.add(1);
            } else if (alerts[i] === 5 || alerts[i] === 9) {
                directions.add(3);
            }
            
        }
        return Array.from(directions);
    }

    #findDirectionByTarget() {
        const myTankX = this.#myTank.X;
        const myTankY = this.#myTank.Y;
        let enemies = this.#enemyTanks;
        if (enemies === null || enemies === undefined || enemies.length === 0) {
            enemies = [this.#anotherBullet];
        }
        // 正负X轴，正负Y轴
        let distanceArr = [[Infinity, 0], [Infinity, 2], [Infinity, 3], [Infinity, 1]]
        for (let enemy of enemies) {
            let x = enemy.X - (myTankX + 25);
            let y = enemy.Y - (myTankY + 25);
            if (x <= 0) {
                distanceArr[0][0] = x < distanceArr[0][0] ? x : distanceArr[0][0];
            } else {
                distanceArr[1][0] = x < distanceArr[1][0] ? x : distanceArr[1][0];
            }
            if (y <= 0) {
                distanceArr[2][0] = y < distanceArr[2][0] ? y : distanceArr[2][0];
            } else {
                distanceArr[3][0] = y < distanceArr[3][0] ? y : distanceArr[3][0];
            }
        }
        distanceArr.sort(function(a,b) {
            return a[1] - b[1];
        })
        let directions = [];
        for (let arr of distanceArr) {
            directions.push(arr[1]);
        }
        return directions;
    }

    land() {
        this.#enemyTanks = aTankCount;
        this.#enemyBullets = aBulletCount;
        var tanks = this.#findPlayerTank(aMyTankCount);
        this.#myTank = tanks[0];
        this.#myBullets = this.type === "B" ? aMyBulletCount1 : aMyBulletCount2;
        this.#anotherTank = tanks[1];
        this.#anotherBullet = this.type === "B" ? aMyBulletCount2 : aMyBulletCount1;
        this.#aworld = this.#aworld;
        this.#mapWidth = mapinfo.info.rwidth;
        this.#mapHeight = mapinfo.info.rheight;
        this.#getNextMove();
        this.#setName();
    }

    leave() {
        this.#setName();
        document.onkeyup(this.#moveEv);
        document.onkeyup(this.#fireEv);
        this.allEnemyTank = [];
    }

})("B");