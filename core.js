function getMatrix(columns, rows) {
    const matrix = []

    let idCounter = 1

    for (let y = 0; y < rows; y++) {
        const row = []

        for (let x = 0; x < columns; x++) {
            row.push({
                id: idCounter++,
                left: false,
                right: false,
                show: false,
                flag: false,
                mine: false,
                potentialMine: false,
                number: 0,
                x,
                y
            })
        }
        matrix.push(row)
    }

    return matrix
}

function getRandomFreeCell(matrix) {
    const freeCells = []

    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            const cell = matrix[y][x]

            if (!cell.mine) {
                freeCells.push(cell)
            }
        }
    }

    const index = Math.floor(Math.random() * freeCells.length)
    return freeCells[index]
}

function setRandomMine(matrix) {
    const cell = getRandomFreeCell(matrix)
    const cells = getAroundCells(matrix, cell.x, cell.y)

    cell.mine = true

    for (const cell of cells) {
        cell.number += 1
    }
}

function getCell(matrix, x, y) {
    if (!matrix[y] || !matrix[y][x]) {
        return false
    }

    return matrix[y][x]
}

function getAroundCells(matrix, x, y) {
    const cells = []

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) {
                continue
            }

            const cell = getCell(matrix, x + dx, y + dy)

            if (cell) {
                cells.push(cell)
            }
        }
    }

    return cells
}

const getCellById = (matrix, id) => matrix
    .flat()
    .find(cell => cell.id === id)

function createElementWithClass(tag, classes) {
    const element = document.createElement(tag)
    element.classList.add(classes)
    return element
}

const setColor = num => {
    switch (num) {
        case 1:
            return '#0090ff'
        case 2:
            return '#00ff00'
        case 3:
            return 'red'
        case 4:
            return 'purple'
        case 5:
            return 'yellow'
        case 6:
            return 'pink'
        default:
            return 'grey'
    }
}

function matrixToHtml(matrix) {
    const gameElement = createElementWithClass('div', 'sapper')

    for (let y = 0; y < matrix.length; y++) {
        const rowElement = createElementWithClass('div', 'row')

        for (let x = 0; x < matrix[y].length; x++) {
            const cell = matrix[y][x]

            const wrapper = createElementWithClass('div', 'wrapper')
            wrapper.draggable = false
            wrapper.oncontextmenu = () => false
            wrapper.setAttribute('data-cell-id', cell.id)
            rowElement.append(wrapper)

            const imgElement = createElementWithClass('img', 'cell-img')
            imgElement.setAttribute('data-cell-id', cell.id)
            imgElement.oncontextmenu = () => false
            wrapper.append(imgElement)

            const wrapperBackground = color => wrapper.style.background = color
            const wrapperBorder = border => wrapper.style[border] = '2px solid green'

            const paintCells = ({id}, first = '#95d039', second = '#9ddc39') => id % 2 === 0
                ? wrapperBackground(first)
                : wrapperBackground(second)

            const isBorder = (matrix, x, y) => {
                if (!cell.show && getCell(matrix, x, y).show) {
                    return true
                }
            }

            if (isBorder(matrix, x + 1, y)) wrapperBorder('borderRight')
            if (isBorder(matrix, x - 1, y)) wrapperBorder('borderLeft')
            if (isBorder(matrix, x, y - 1)) wrapperBorder('borderTop')
            if (isBorder(matrix, x, y + 1)) wrapperBorder('borderBottom')

            if (cell.flag) {
                paintCells(cell)
                imgElement.src = 'assets/flag.png'
                continue
            }

            if (cell.potentialMine) {
                paintCells(cell, '#ade066', '#bfff72')
                continue
            }

            if (!cell.show) {
                paintCells(cell)
                continue
            }

            if (cell.mine) {
                paintCells(cell, '#e3be5d', '#deb749')
                imgElement.src = 'assets/mine.png'
                continue
            }

            if (cell.number) {
                paintCells(cell, '#e3be5d', '#deb749')
                wrapper.innerText = cell.number
                wrapper.style.color = setColor(cell.number)
                continue
            }
            paintCells(cell, '#e3be5d', '#deb749')
            wrapper.innerText = ''
        }

        gameElement.append(rowElement)
    }

    return gameElement
}

const forEachInMatrix = (matrix, handler) => {
    matrix.forEach(arr => {
        arr.forEach(item => handler(item))
    })
}

function showSpread(matrix, x, y) {
    const cell = getCell(matrix, x, y)

    if (cell.flag || cell.number || cell.mine) {
        return
    }

    playSound('assets/sounds/Blop-Mark_DiAngelo-79054334.mp3')

    forEachInMatrix(matrix, x => x._marked = false)

    cell._marked = true

    let flag = true
    while (flag) {
        flag = false

        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix.length; x++) {
                const cell = matrix[y][x]

                if (!cell._marked || cell.number) {
                    continue
                }

                const cells = getAroundCells(matrix, x, y)

                for (const cell of cells) {
                    if (cell._marked) {
                        continue
                    }

                    if (!cell.flag && !cell.mine) {
                        cell._marked = true
                        flag = true
                    }
                }
            }
        }
    }

    forEachInMatrix(matrix, x => {
        if (x._marked) {
            x.show = true
        }

        delete x._marked
    })
}

function isWin(matrix) {
    const flags = []
    const mines = []

    forEachInMatrix(matrix, cell => {
        if (cell.flag) {
            flags.push(cell)
        }

        if (cell.mine) {
            mines.push(cell)
        }
    })

    if (flags.length !== mines.length) {
        return false
    }

    for (const cell of mines) {
        if (!cell.flag) {
            return false
        }
    }

    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            const cell = matrix[y][x]

            if (!cell.mine && !cell.show) {
                return false
            }
        }

    }
    gameFinished('You win!')

    playSound('assets/sounds/woohoo.mp3')

    return true
}

function isLosing() {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            const cell = matrix[y][x]


            if (cell.mine && cell.show) {

                setNelson('block')

                gameFinished('You lose!')

                playSound('assets/sounds/haha.mp3')
                return true
            }
        }
    }

    return false
}

const setNelson = display => document
    .querySelector('.nelson')
    .style.display = display

const gameFinished = text => {
    const finish = document.querySelector('.finish')
    const finishTitle = document.querySelector('.finish__title')

    finish.style.display = 'block'
    finishTitle.textContent = text
}

const playSound = path => new Audio(path).play()

const countOfMine = select => {
    switch (parseInt(select.value)) {
        case 2:
            return 15
        case 3:
            return 25
        default:
            return 10
    }
}

const setRefresh = classes => {
    const refresh = document.querySelector('.refresh__btn')
    if (classes) {
        refresh.classList.add(classes)
    } else {
        refresh.classList.remove('active')
    }
}
