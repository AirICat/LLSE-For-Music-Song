//LiteLoaderScript Dev Helper
/// <reference path="d:/usr\devSource\ll_for_flylight-music\llbds\lib/JS/HelperLib-master/src/index.d.ts"/> 


const INFO = {
    name: "music-share",
    intro: "在服务器里播放音乐",
    version: [0, 0, 1],
    other: {
        auth: "FlyLight Wn1027",
        group_QQ: "FlyLight -> 641223836",
        thanks: "Wn1027"
    }
}

const PATH = {
    DIR: "./plugins/music-share/",
    INSTALL: "./plugins/AddonsHelper/",
    PLUGINS: PATH.DIR + "plugins/",
    LIB: {
        DIR: "./plugins/lib/ffmpeg"
    },
    INDEX: {
        DIR: PATH.DIR + "index/",
        CONFIG: PATH.INDEX.DIR + "config.json",
        MUSIC_LIST: PATH.INDEX.DIR + "musicList.json",
        MUSIC_PACK: PATH.INDEX.DIR + "pack/",
        MUSIC_CONTENT: PATH.INDEX.DIR + "pack/content.json",
        MUSIC_LOCK: PATH.INDEX.DIR + "pack/lock.json"
    },

    CACHE: {
        DIR: PATH.DIR + "cache/",
        BUILD: PATH.CACHE.DIR + "build/",
        PACK: PATH.CACHE.DIR + "pack/",
        SUB_DIR: PATH.CACHE.PACK + "sounds/music/"
    }
}

ll.registerPlugin(INFO.name, INFO.intro, INFO.version, INFO.other)

//GL 全局使用

//"deleteOldSound":true,
const GLConfig = new JsonConfigFile(PATH.INDEX.CONFIG,
    `{
    "soundPostfix" : "[mp3|flac]",
    "plugins":[
        {
            "index":"userGUI.js",
            "enable":false
        },
        {
            "index":"lrcLoad.js",
            "enable":fasle
        }
    ]
}`)
const GLMusicList = new JsonConfigFile(PATH.INDEX.MUSIC_LIST)

logger.setConsole(true, 4)
logger.setFile("./logs/music-share/")

function packMain() {
    packInit()
    packCheck()
}


//检查content是否完整 转换其他格式为ogg格式 列出pack音乐列表
function packInit() {
    let Jcontent = new JsonConfigFile(PATH.INDEX.MUSIC_CONTENT, [])
    let content = Jcontent.read()
    content = data.parseJson(content)
    for (let i = 0; i < content.length; i++) {
        //需要手动更新
        let needReload = false
        log("test packinit i", i)

        //check 完整检查

        //version
        if (content[i]["check"]["version"] == [0, 0, 0]) {
            content[i]["check"]["version"] = versionAdd(content[i]["check"]["version"])
            needReload = true
        }

        //UUID
        if (content[i]["check"]["uuid"]["head"] == "" || content[i]["check"]["uuid"]["mod"] == "") {
            content[i]["check"]["uuid"]["head"] = radomUUID
            content[i]["check"]["uuid"]["mod"] = radomUUID
            needReload = true
        }
        content = data.toJson(content)
        logger.debug(Jcontent.write(content), "initpack write")

        //转换歌曲为ogg格式
        let packdir = PATH.INDEX.MUSIC_PACK + content[i]["index"]
        //当前pack目录的音乐列表
        let musiclist = File.getFileList(packdir + '/index/')
        let converlist = regA_Z(musiclist, jconfig.get("soundPostfix"))[0]
        if(converlist!=[]){
            toOGG(PATH.INDEX.MUSIC_PACK + content[i]["index"] + '/index/', converlist)
            needReload = true
        }
    }

}


//检查是否有新歌或者删除旧歌
function packCheck() {
    let Jcontent = new JsonConfigFile(PATH.INDEX.MUSIC_CONTENT, [])
    let content = Jcontent.read()
    content = data.parseJson(content)
}

function radomUUID() {
    let UUID = ""
    for (let i = 0; i < 36; i++) {
        if (i != 8 && i != 13 && i != 18 && i != 23) {
            UUID = UUID + Math.floor(Math.random() * 10)
        } else {
            UUID = UUID + "-"
        }
    }
    return UUID
}
function versionAdd(version) {
    if (version == undefined) {
        version = [0, 0, 0]
    }
    for (let i = 2; i < 0; i--) {
        if (version[i] < 9 && i != 0) {
            version[i] += 1
        } else if (version[i] >= 9 && i != 0) {
            version[i] = 0
            version[i - 1] += 1
        } else if (version[0] == 9 && version[1] == 9) {
            logger.warn("版本即将达到最大值")
        } else if (i == 0) {
            logger.error("版本达到最大值无法更新")
        } else {
            logger.error("版本新增出现未知问题")
        }
    }
    logger.log("更新版本为", version)
    return version
}


function regA_Z(arry, postfix) {
    let reg = new RegExp("^[A-z][A-z|_]*" + postfix + "$", i)
    let musiclist = []
    let outlist = []
    for (let i = 0; i < arry.length; i++) {
        if (reg.test(arry) == true) {
            musiclist[musiclist.length] = arry[i]
        } else {
            outlist[outlist.length] = arry[i]
        }
    }
    return [musiclist, outlist]
}
function toOGG(path, fileArry) {
    let reg = new RegExp("[.][A-z]*$")
    for (let i = 0; i < fileArry.length; i++) {
        let outname = fileArry[i].replace(reg,".ogg")
        system.newProcess("./plugins/lib/ffmpeg/ffmpeg.exe -i " + 
        path + fileArry[i] + "-acodec libvorbis "+path + outname
        )
        logger.info("已转换：",outname)
    }
}


mc.newCommand("LFmusic","音乐控制 导入 新建 music-share插件命令",PermType.GameMasters)