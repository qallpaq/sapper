let matrix = null
let running = null

const select = document.querySelector('.select')

init(11, 11, countOfMine(select))

document
    .querySelector('.settings__btn')
    .addEventListener('click', () => init(11, 11, countOfMine(select)))

function init(columns, rows, mines) {

    matrix = getMatrix(columns, rows)
    running = true

    setNelson('none')

    document
        .querySelector('.finish')
        .style.display = 'none'

    for (let i = 0; i < mines; i++) {
        setRandomMine(matrix)
    }

    update()
}

function update() {
    if (!running) {
        return
    }

    const gameElement = matrixToHtml(matrix)
    const appElement = document.querySelector('.sapper-wrapper')

    appElement.innerHTML = ''
    appElement.append(gameElement)

    appElement
        .querySelectorAll('.wrapper')
        .forEach(wrapper => {
            wrapper.addEventListener('mousedown', mousedownHandler)
            wrapper.addEventListener('mouseup', mouseupHandler)
            wrapper.addEventListener('mouseleave', mouseleaveHandler)
        })

    if (isLosing(matrix)) {
        running = false
    } else if (isWin(matrix)) {
        running = false
    }
}

function mousedownHandler(event) {
    const {cell, left, right} = getInfo(event)

    if (left) {
        cell.left = true
    }

    if (right) {
        cell.right = true
    }

    if (cell.left && cell.right) {
        bothHandler(cell)
    }

    update()
}

function mouseupHandler(event) {
    const {left, right, cell} = getInfo(event)

    const both = cell.right && cell.left && (left || right)
    const leftMouse = !both && cell.left && left
    const rightMouse = !both && cell.right && right

    if (both) {
        forEachInMatrix(matrix, x => x.potentialMine = false)
    }

    if (left) {
        cell.left = false
    }

    if (right) {
        cell.right = false
    }

    if (leftMouse) {
        leftHandler(cell)
    } else if (rightMouse) {
        rightHandler(cell)
    }

    update()
}

function mouseleaveHandler(event) {
    const info = getInfo(event)

    info.cell.left = false
    info.cell.right = false

    update()
}

function getInfo(event) {
    const element = event.target
    const cellId = parseInt(element.getAttribute('data-cell-id'))

    return {
        left: event.which === 1,
        right: event.which === 3,
        cell: getCellById(matrix, cellId)
    }
}

function leftHandler(cell) {

    if (cell.show || cell.flag) {
        return
    }
    cell.show = true

    showSpread(matrix, cell.x, cell.y)
}

function rightHandler(cell) {
    if (!cell.show) {
        cell.flag = !cell.flag
    }
}

function bothHandler(cell) {
    if (!cell.show || !cell.number) {
        return
    }

    const cells = getAroundCells(matrix, cell.x, cell.y)
    const flags = cells.filter(x => x.flag).length

    if (flags === cell.number) {
        cells
            .filter(x => !x.flag && !x.show)
            .forEach(cell => {
                cell.show = true
                showSpread(matrix, cell.x, cell.y)
            })
    } else {
        cells
            .filter(x => !x.flag && !x.show)
            .forEach(cell => cell.potentialMine = true)
    }
}