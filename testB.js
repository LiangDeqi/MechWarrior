class ObjectB{
    constructor(speed, direction, X, Y) {
        this.speed = speed
        this.direction = direction
        this.X = X
        this.Y = Y
    }
}
class TankAttackResultB{
    constructor(hitTime, direction) {
        this.hitTime = hitTime
        this.direction = direction
    }
}

const step5 = [[0, -1], [1, 0], [0, 1], [-1, 0], [0, 0]];
const step = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const dig = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
window.playerB = new (class PlayerControl {

    // A 选手   B 选手
    constructor(type) {
        this.type = type;
        this.#moveEv = new CustomEvent("keydown");
        this.#fireEv = new CustomEvent("keydown");
        this.firetimestamp = (new Date()).valueOf()
        this.priority = this.#DIRECTION.STOP;
        this.MAX_DISTANCE = 0;
        this.BULLET_WIDTH = 10;
        this.TANK_WIDTH = 50;
        this.DANGER_DISTANCE = 3 * this.TANK_WIDTH;
        this.BEST_FIRE_DISTANCE = 4 * this.TANK_WIDTH;
        this.MIN_FIRE_OFFSET = (this.TANK_WIDTH + this.BULLET_WIDTH)/2;
        this.FIRE_MAX_DISTANCE = this.DANGER_DISTANCE + 2 * this.TANK_WIDTH;
        this.shouldFire = false;
        this.allEnemyTank = []

        this.tankSpeed = 7
        this.bulletSpeed = 10
        this.tankWidth = 50
        this.bulletWidth = 10
        this.attackDirection = this.#DIRECTION.UP
        this.cnt = 2
        this.battleMap = null
        this.blockSize = 50
        this.gripX= Math.floor(bwidth / this.blockSize)
        this.gripY = Math.floor(bheight / this.blockSize)
        this.bulletNumber = 4
        this.obstacle = null
        this.escapeResult = null
        this.escapeFrame = 10
        this.esacpeCalculateFlag = false
        this.escapePosition = null
        this.turnNo = 0
        this.bullets = null
        this.bulletNo = 0

        //可移到方向，合作时的传递值
        this.availableDirection = []
        this.safeDistance = 150
    }

    // 方向的别名
    #DIRECTION = {
        UP: 0,
        RIGHT: 1,
        DOWN: 2,
        LEFT: 3,
        STOP: 4,//无子弹
        BLOCK:5,//阻挡
        BORDER:6//边界
    };
    // 开火事件
    #fireEv;
    // 移动事件
    #moveEv;

    getEnemyTank() {
        if (aTankCount.length > 0) {
            return aTankCount
        }
        let ans = null
        aMyTankCount.forEach(element => {
            let c = element
            if (c['id'] == 100) {
                ans = c
            }
        })
        return ans == null ? [] : [ans]
    }

    getEnemyBullet() {
        if (aworld == null || aworld == undefined || aworld.length < this.gripX * this.gripY) return []
        if (this.turnNo != this.bulletNo) {
            this.bullets = []
            for (let eb in aBulletCount) {
                const direction = aBulletCount[eb].direction;
                const speed = aBulletCount[eb].speed;
                let newBullet = new ObjectB(speed, direction,
                    aBulletCount[eb].X + step[direction][0] * 0 - this.bulletWidth / 2,
                    aBulletCount[eb].Y + step[direction][1] * 0 - this.bulletWidth / 2)
                if (!this.bulletInObstacle(newBullet)) {
                    this.bullets.push(newBullet)
                }
            }
            if (aBulletCount.length == 0) {
                for (let b in aMyBulletCount1) {
                    this.bullets.push(new ObjectB(aMyBulletCount1[b].speed, aMyBulletCount1[b].direction,
                        aMyBulletCount1[b].X - this.bulletWidth / 2, aMyBulletCount1[b].Y - this.bulletWidth / 2))
                }
            }
            this.bulletNo = this.turnNo
        }
        return this.bullets
    }

    getMyBullet() {
        let result = []
        for (let b in aMyBulletCount2) {
            result.push(new ObjectB(aMyBulletCount2[b].speed, aMyBulletCount2[b].direction,
                aMyBulletCount2[b].X - this.bulletWidth / 2, aMyBulletCount2[b].Y - this.bulletWidth / 2))
        }
        return result
    }

    land() {
        let cur = undefined
        aMyTankCount.forEach(element => {
            let c = element
            if (c['id'] == 200) {
                cur = c
            }
        });
        if (cur == undefined || cur == null)return

        if (this.battleMap == null) {
            this.battleMap = mapinfo.blocks
        }
        this.turnNo++
        let fireDirection = this.fireDirection().direction;

        this.avoidDirection(cur)

        if (fireDirection !== this.#DIRECTION.STOP) {
            if (this.attackDirection == fireDirection) {
                this.#fire()
            } else {
                if (this.availableDirection[fireDirection]) {
                    this.attackDirection = fireDirection
                    this.#move(fireDirection)
                    return
                }
            }
        }
        let targetDirection = this.targetDirection(cur);
        let moveDirection = null;
        for (let t in targetDirection) {
            if (this.availableDirection[targetDirection[t]]) {
                moveDirection = targetDirection[t];
                break
            }
        }
        if (moveDirection == null) {
            for (let i = 0; i < 5; i++) {
                if (this.availableDirection[i]) {
                    moveDirection = i
                    break
                }
            }
            if (moveDirection == null) moveDirection = targetDirection[0];
        }
        this.#move(moveDirection);
        if (this.#DIRECTION.STOP != moveDirection) {
            this.attackDirection = moveDirection;
        }
        this.#setName();
    }

    fireDirection() {
        let cur = undefined
        aMyTankCount.forEach(element => {
            let c = element
            if (c['id'] == 200) {
                cur = c
            }
        });

        let result = new TankAttackResultB(100000, this.#DIRECTION.STOP);
        let enemyTanks = this.getEnemyTank();
        for(let et in enemyTanks) {
            let hitResult = this.calculateTankHitTank(cur, enemyTanks[et])
            if (hitResult != null && hitResult.hitTime < result.hitTime) {
                result = hitResult
            }
        }
        //子弹数量限制
        let myBullets = this.getMyBullet()
        if (result.hitTime > 50) {
            result.direction = this.#DIRECTION.STOP
        } else if (result.hitTime > 20) {
            if (this.bulletNumber - myBullets.length <= 3) {
                result.direction = this.#DIRECTION.STOP
            }
        } else if (result.hitTime > 10) {
            if (this.bulletNumber - myBullets.length <= 1) {
                result.direction = this.#DIRECTION.STOP
            }
        }
        if (result.direction === this.#DIRECTION.STOP || result.hitTime > 20) {
            if (this.bulletNumber - myBullets.length > 3) {
                if (this.attackBlock(cur)) {
                    return new TankAttackResultB(0, this.attackDirection)
                }
            }
        }
        return result;
    }

    avoidDirection(cur) {
        this.availableDirection = [false, false, false, false, false]
        let tmp = [-1, -1, -1, -1, -1]
        this.calculateObstacle(cur)
        for (let i = 0; i < 5; i++) {
            let np = this.adjustTurn(cur, (i + 1) % 4, i, cur.speed)
            let newPos = new ObjectB(cur.speed, i, np[0], np[1])
            if (!this.isAlive(newPos, 0)) continue
            tmp[i] = this.dfsEscape(i, newPos, 0)
            if (tmp[i] > -1){
                this.availableDirection[i] = true
            }
        }
    }

    getMaxDistance(cur) {
        let enemyTanks = this.getEnemyTank();
        let minDis = 1000000
        for (let et in enemyTanks) {
            minDis = Math.min(this.#calcTwoPointDistance(cur.X, cur.Y, enemyTanks[et].X, enemyTanks[et].Y), minDis)
        }
        return Math.floor(minDis)
    }

    targetDirection(cur) {
        let enemyTanks = this.getEnemyTank();
        if (enemyTanks.length == 0) {
            return [this.#DIRECTION.STOP]
        }
        let result = []
        let minDis = 1000000
        let targetTank = undefined
        for (let et in enemyTanks) {
            let dis = this.#calcTwoPointDistance(cur.X, cur.Y, enemyTanks[et].X, enemyTanks[et].Y)
            if (dis < minDis) {
                minDis = dis
                targetTank = enemyTanks[et]
            }
        }

        if (minDis < this.safeDistance) {
            let arr = []
            for (let i = 0; i < 4; i++) {
                let pos = this.adjustTurn(cur, (i + 1) % 4, i, cur.speed)
                arr.push(this.getMaxDistance(new ObjectB(cur.speed, i, pos[0], pos[1])) * 5 + i)
            }
            arr.push(Math.floor(minDis) * 5 + 4)
            arr.sort()
            let safeIndex = 0
            for (;safeIndex < 5; safeIndex++) if (arr[safeIndex] / 5 >= this.safeDistance) break
            for (let i = safeIndex; i < 5; i++) result.push(arr[i] % 5)
            for (let i = safeIndex - 1; i > -1; i--) result.push(arr[i] % 5)
            return result
        }

        let randDir = Math.floor(Math.random() * 2)
        result.push(this.#DIRECTION.RIGHT)
        result.push(this.#DIRECTION.DOWN)
        result.push(this.#DIRECTION.STOP)
        result.push(this.#DIRECTION.UP)
        result.push(this.#DIRECTION.LEFT)

        if (targetTank.X < cur.X) {
            [result[0], result[4]] = [result[4], result[0]]
        }
        if (targetTank.Y < cur.Y) {
            [result[1], result[3]] = [result[3], result[1]]
        }
        if (randDir == 0) {
            [result[0], result[1]] = [result[1], result[0]];
            [result[3], result[4]] = [result[4], result[3]];
        }
        return result;
    }

    calculateBulletHitTank(tank, bullet, tankOut) {
        let arr = [[tank.X + this.tankWidth / 2, tank.Y + this.tankWidth / 2],
            [bullet.X + this.bulletWidth / 2, bullet.Y + this.bulletWidth / 2]]
        let distance = [arr[0][0] - arr[1][0], arr[0][1] - arr[1][1]]
        let speed = [bullet.speed * step5[bullet.direction][0] - tank.speed * step5[tank.direction][0],
            bullet.speed * step5[bullet.direction][1] - tank.speed * step5[tank.direction][1]]
        const maxTime = 100000
        let collisionTime = [[maxTime, maxTime], [maxTime, maxTime]]
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                if (speed[i] == 0) {
                    collisionTime[i][j] = (j == 0 && Math.abs(distance[i]) <= (this.bulletWidth + this.tankWidth) / 2) ?
                        0 : maxTime;
                } else {
                    if (speed[i] * distance[i] < 0) {
                        collisionTime[i][j] = (j == 0 && Math.abs(distance[i]) <= (this.bulletWidth + this.tankWidth)
                            / 2) ? 0 : maxTime;
                    } else {
                        collisionTime[i][j] = Math.max(Math.ceil((Math.abs(distance[i]) + (this.bulletWidth +
                            this.tankWidth) / 2 * Math.pow(-1, j + 1)) / Math.abs(speed[i])), 0)
                    }
                }
            }
        }
        let hitTime = maxTime
        if (Math.max(collisionTime[0][0], collisionTime[1][0]) <= Math.min(collisionTime[0][1], collisionTime[1][1])) {
            hitTime = Math.max(collisionTime[0][0], collisionTime[1][0])
        }
        if (hitTime == maxTime) return -1
        if (!this.objectCanThrough(bullet.X, bullet.Y, this.bulletWidth, bullet.direction, this.bulletSpeed,
            hitTime, 2, true)) return -1
        if (tankOut) return hitTime
        if (!this.objectCanThrough(tank.X, tank.Y, this.tankWidth, tank.direction, this.tankSpeed, hitTime,
            1, true)) return tank.direction == bullet.direction ? hitTime : -1
        return hitTime
    }

    calculateTankHitTank(src, tar) {
        for (let i = 0; i < 4; i++) {
            let pos = this.adjustTurn(src, this.attackDirection, i, src.speed)
            // let pos = [src.X, src.Y]
            let tmpBullet = new ObjectB(this.bulletSpeed, i, pos[0] + this.tankWidth / 2 +
                step5[i][0] * this.tankWidth / 2, pos[1] + this.tankWidth / 2 + step5[i][1] * this.tankWidth / 2)
            let hitTime = this.calculateBulletHitTank(tar, tmpBullet, false)
            if (hitTime >= 0) return new TankAttackResultB(hitTime + (this.attackDirection == i ? 0 : 1), i)
        }
        return null
    }

    attackBlock(tank) {
        let nowX = Math.floor((tank.X + this.tankWidth / 2 + this.tankWidth / 2 * step[this.attackDirection][0])
            / this.blockSize)
        let nowY = Math.floor((tank.Y + this.tankWidth / 2 + this.tankWidth / 2 * step[this.attackDirection][1])
            / this.blockSize)
        while (true) {
            if (!this.inGrid(nowX, nowY)) break
            let pos = nowX + nowY * this.gripX
            if (pos != null) {
                if (aworld[pos][4] == 1) break
                if ((aworld[pos][4] == 4 || aworld[pos][4] == 8) && aworld[pos][5] > 0) return true
            }
            nowX += step[this.attackDirection][0]
            nowY += step[this.attackDirection][1]
        }
        return false
    }

    //左上角顶点 rule 1:坦克，2:子弹
    objectCanThrough(x, y, width, direction, speed, runTime, rule, canOutBorder) {
        if (direction == 4) {
            return true
        }
        let arr = [x + width / 2, y + width / 2]
        for (let i = 0; i < 2; i++)arr[i] = arr[i] + dig[direction][i] * width / 2
        for (let ll = 0; ll < 100000; ll++){
            if(arr[0] < x || arr[0] >= x + this.blockSize || arr[1] < y || arr[1] >= y + this.blockSize) break
            let pos = [Math.floor(arr[0] / this.blockSize), Math.floor(arr[1] / this.blockSize)]
            for (let i = 0; i < runTime; i++) {
                for (let j = 0; j < 2; j++) pos[j] += step[direction][j]
                if (!this.inGrid(pos[0], pos[1])) {
                    if (canOutBorder)break
                    else return false
                }
                let blockType = this.battleMap[pos[0] + pos[1] * this.gripX]
                switch (rule) {
                    case 1:
                        if (blockType == 1 || blockType == 2 ||
                            (blockType == 4 &&  aworld[pos[0] + pos[1] * this.gripX][5] > 0) ||
                            (blockType == 8 && aworld[pos[0] + pos[1] * this.gripX][5] > 0)) {
                            return false
                        }
                        break
                    default:
                        if (blockType == 1 ||
                            (blockType == 4 &&  aworld[pos[0] + pos[1] * this.gripX][5] > 0) ||
                            (blockType == 8 && aworld[pos[0] + pos[1] * this.gripX][5] > 0)) {
                            return false
                        }
                }
            }
            for (let i = 0; i < 2; i++)arr[i] = arr[i] + step[(direction + 1) % 4][i] * this.blockSize
        }
        return true
    }

    inGrid(x, y) {
        return x > -1 && x < bwidth / this.blockSize && y > -1 && y < bheight / this.blockSize
    }

    inAxis(x, y) {
        return x > -1 && x < bwidth && y > -1 && y < bheight
    }

    //左上角顶点 转向后位置,输入为转向前的坦克
    adjustTurn(tank, oldDirect, newDirect, speed) {
        if (oldDirect == newDirect || newDirect == this.#DIRECTION.STOP) {
            return [tank.X, tank.Y]
        }
        let arr = [Math.floor(tank.X + this.tankWidth / 2), Math.floor(tank.Y + this.tankWidth / 2)]
        for (let i = 0; i < 2; i++)arr[i] = arr[i] + step[newDirect][i] * speed
        let needAdjust = false
        let pos = [arr[0] + dig[newDirect][0] * this.tankWidth / 2, arr[1] + dig[newDirect][1] * this.tankWidth / 2]
        if (!this.inAxis(pos[0], pos[1])) {
            needAdjust = true
        } else {
            while (pos[0] >= arr[0] - this.tankWidth / 2 && pos[0] <= arr[0] + this.tankWidth / 2
            && pos[1] >= arr[1] - this.tankWidth / 2 &&
            pos[1] <= arr[1] + this.tankWidth / 2) {
                if (!this.inAxis(pos[0], pos[1])) {
                    needAdjust = true
                    break
                }
                let gridXPosition = Math.floor(pos[0] / this.blockSize)
                let gridYPosition = Math.floor(pos[1] / this.blockSize)
                let blockType = this.battleMap[gridXPosition + gridYPosition * this.gripX]
                if (blockType == 1 || blockType == 2) {
                    needAdjust = true
                    break
                }
                if ((blockType == 4 || blockType == 8) && aworld[gridXPosition + gridYPosition * this.gripX][5] > 0) {
                    needAdjust = true
                    break
                }
                for (let i = 0; i < 2; i++) pos[i] = pos[i] + step[(newDirect + 1) % 4][i] * this.blockSize
            }
        }
        if(needAdjust) {
            if (newDirect == this.#DIRECTION.RIGHT && arr[0] + this.tankWidth >= bwidth) arr[0] = bwidth - this.tankWidth / 2
            else if (newDirect == this.#DIRECTION.DOWN && arr[1] + this.tankWidth >= bheight) arr[1] = bheight - this.tankWidth / 2
            else if (newDirect == this.#DIRECTION.LEFT && arr[0] - this.tankWidth <= 0) arr[0] = 25
            else if (newDirect == this.#DIRECTION.UP && arr[1] - this.tankWidth <= 0) arr[1] = 25
            else arr = [Math.floor(tank.X + this.tankWidth / 2), Math.floor(tank.Y + this.tankWidth / 2)]
        }
        return [arr[0] - this.tankWidth / 2, arr[1] - this.tankWidth / 2]
    }

    calculateObstacle(cur) {
        this.obstacle = []
        for (let i = 0; i < this.escapeFrame; i++) {
            this.obstacle.push([])
        }
        let enemyBullet = this.getEnemyBullet()
        const safeDistance = Math.ceil((this.tankSpeed + this.bulletSpeed) * this.escapeFrame / this.blockSize)
        for (let eb in enemyBullet) {
            if (enemyBullet[eb].X > cur.X - safeDistance * this.tankWidth &&
                enemyBullet[eb].X < cur.X + safeDistance * this.tankWidth &&
                enemyBullet[eb].Y > cur.Y - safeDistance * this.tankWidth &&
                enemyBullet[eb].Y < cur.Y + safeDistance * this.tankWidth)
                this.obstacle[0].push(enemyBullet[eb])
        }
        for (let i = 1; i < this.escapeFrame; i++) {
            for (let o in this.obstacle[i-1]) {
                let direction = this.obstacle[i-1][o].direction;
                let newObject = new ObjectB(this.obstacle[i-1][o].speed, direction,
                    this.obstacle[i-1][o].X + step5[direction][0] * this.obstacle[i-1][o].speed,
                    this.obstacle[i-1][o].Y + step5[direction][1] * this.obstacle[i-1][o].speed)
                if (!this.bulletInObstacle(newObject) &&
                    newObject.X > cur.X - safeDistance * this.tankWidth &&
                    newObject.X < cur.X + safeDistance * this.tankWidth &&
                    newObject.Y > cur.Y - safeDistance * this.tankWidth &&
                    newObject.Y < cur.Y + safeDistance * this.tankWidth
                ) {
                    this.obstacle[i].push(newObject)
                }
            }
        }
    }

    dfsEscape(state, cur, depth) {
        if (depth == this.escapeFrame) {
            if (this.isSafe(cur)) {
                return state
            } else {
                return -1
            }
        }
        for (let i = 0; i < 5; i++) {
            let np = this.adjustTurn(cur, (i + 1) % 4, i, cur.speed)
            let newPos = new ObjectB(cur.speed, i, np[0], np[1])
            if (!this.isAlive(newPos, depth + 1))continue
            let result = this.dfsEscape(state * 5 + i, newPos, depth + 1)
            if (result > -1) return result
        }
        return -1
    }

    isSafe(cur) {
        for (let o in this.obstacle[this.escapeFrame - 1]) {
            const bullet = this.obstacle[this.escapeFrame - 1][o]
            let canLive = false
            for (let i = 0; i < 2; i++) {
                let tmpTank = new ObjectB(cur.speed, (bullet.direction + 1 + 2 * i) % 4, cur.X, cur.Y)
                if (this.calculateBulletHitTank(tmpTank, bullet, true) == -1) {
                    canLive = true
                    break
                }
            }
            if (!canLive) return false
        }
        return true
    }

    isAlive(cur, timeIndex) {
        for (let o in this.obstacle[timeIndex]) {
            const bullet = this.obstacle[timeIndex][o]
            if ((Math.abs(cur.X + this.tankWidth / 2 - bullet.X - this.bulletWidth / 2)
                <= (this.tankWidth + this.bulletWidth) / 2 + 1) &&
                Math.abs(cur.Y + this.tankWidth / 2 - bullet.Y - this.bulletWidth / 2)
                <= (this.tankWidth + this.bulletWidth) / 2 + 1) {
                return false
            }
        }
        return true
    }

    bulletInObstacle(obj) {
        let center = [obj.X + this.bulletWidth / 2, obj.Y + this.bulletWidth / 2]
        for (let i = 0; i < 4; i++) {
            let pos = []
            for (let j = 0; j < 2; j++) pos.push(Math.floor((center[j] + dig[i][j] * this.bulletWidth / 2) / 50))
            const posGrip = pos[0] + pos[1] * this.gripX;
            if (!this.inGrid(pos[0], pos[1]) || aworld[posGrip][4] == 1 ||
                (aworld[posGrip][4] == 4 &&  aworld[posGrip][5] > 0) ||
                (aworld[posGrip][4] == 8 && aworld[posGrip][5] > 0)) {
                return true
            }
        }
        return false
    }

    leave() {
        this.#setName();
        document.onkeyup(this.#moveEv);
        document.onkeyup(this.#fireEv);
        this.allEnemyTank = [];
    }
    type;
    // private
    // 根据玩家返回正确的方向keyCode
    #helpDirectionKeyCode(direction) {
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
        ).value = "Winston"
        document.getElementById(
            `Player${this.type === "A" ? 1 : 2}Name`
        ).textContent = "Winston"
    }
    // 控制移动   举例子：  向左移动： this.#move(this.#DIRECTION.LEFT)
    #move(direction) {
        if (direction == undefined) return;
        this.#moveEv.keyCode = this.#helpDirectionKeyCode(direction);
        document.onkeydown(this.#moveEv);
    }
    // 开火
    #fire(direction) {
        this.#fireEv.keyCode = this.type === "A" ? 32 : 8;
        document.onkeydown(this.#fireEv);
    }

    #calcTwoPointDistance(ax, ay, bx, by) {
        return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
    }

})("B");