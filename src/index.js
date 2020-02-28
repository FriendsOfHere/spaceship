/*
 * This file is part of foh.spaceship.
 *
 * Copyright (c) 2020 Lifesign.
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

const _ = require("lodash")
const spaceshipConfName = '.spaceship.json'
const homeDir = '/Users/$(whoami)'

here.onLoad(() => {
  ensureConfigExists()
  setupSpaceship()
})

function ensureConfigExists() {
  here.exec(`
[ ! -f ${homeDir}/${spaceshipConfName} ] && cp ./template/spaceship.json ${homeDir}/${spaceshipConfName} && echo "config init done."
`)
  .then((output) => {
    console.log(output)
  }).catch((err) => {console.log(`config init error: ${err}`)})
}

function setupSpaceship() {
  console.log('setup begin ........')

  here.setMiniWindow({title: `Spaceship Loading..`})

  here.exec(`
cat ${homeDir}/${spaceshipConfName}
`).then((output) => {
    const config = JSON.parse(output);
  // console.log(JSON.stringify(config.cabins))
    const popOvers = _.map(config.cabins, (cabin) => {
      return {
        title: cabin.name,
        onClick: () => {
          console.log(JSON.stringify(cabin))
          //smart execute
          if (typeof cabin.type == "undefined" || cabin.type == "cmd") {
            executeCmdType(cabin.payload)
          } else if (cabin.type == "app")  {
            executeAppType(cabin.payload)
          } else {
            here.systemNotification(`不支持的 Cabin 类型`, `目前仅支持 cmd, app 类型，请重新修改配置文件`)
          }
        },
        accessory: {
            imageURL: getImageUrlByType(cabin),
            imageCornerRadius: 4
          }
      }
    })

    here.setMiniWindow({
        title: `Spaceship Ready..`,
        detail: "点击此处修改配置文件",
        onClick: () => {
          //quick open .spaceship.json
          here.exec(`${getEditConfigExecution(config.editor)}`)
              .then((output) => {
                console.log(`open config file: output: ${output}`)
                _.delay(() => {
                  here.systemNotification(`温馨提醒`, `变更配置后请重启 Here 或者重载 Spaceship 插件生效`)
                }, 1000)
              }).catch((err) => {console.log(`open config file error: ${err}`)})
        },
        popOvers: popOvers
    })

    console.log('mini window setup ready...')

  })
  .catch((err) => {
    // TODO check json syntax
    console.error(err)
  })

  //add menu bar support
  here.setMenuBar({title: `Spaceship Ready..`})

}

function executeCmdType(payload) {
  here.exec(`osascript -e '
tell application "Terminal"
  reopen
  activate
  do script "${payload}" in front window
end tell
'`)
    .then((output) => {
      console.log(`[Cabin Execute][type:cmd] output: ${output}`)
    })
    .catch((err) => {console.log(`Cabin Execute][type:cmd] error: ${output}`)})
}

function executeAppType(payload) {
  here.exec(`open -a ${payload}`)
    .then((output) => {
      console.log(`[Cabin Execute][type:app] output: ${output}`)
    })
    .catch((err) => {console.log(`[Cabin Execute][type:app] error: ${output}`)})
}

function getImageUrlByType(cabin) {
  let imageUrl = ''
  if (typeof cabin.type == "undefined" || cabin.type == "cmd") {
    imageUrl = 'cli.png'
  } else if (cabin.type == "app")  {
    imageUrl = 'mac.png'
  } else {
    imageUrl = 'q.png'
  }

  return imageUrl
}

function getEditConfigExecution(editor) {
  if (typeof editor == 'undefined' || editor == 'default') {
    return `open ${homeDir}/${spaceshipConfName}`
  } else if (_.includes(['vi', 'nano', 'vim'], editor)) {
    return `osascript -e '
tell application "Terminal"
  reopen
  activate
  do script "${editor} ${homeDir}/${spaceshipConfName}" in front window
end tell'`
  } else {
    return `${editor} ${homeDir}/${spaceshipConfName}`
  }
}
