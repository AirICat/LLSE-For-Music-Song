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

logger.setConsole(true, 5)
logger.setFile("./logs/music-share/")

const CONFIGINFO = {
    VERSION: [0, 0, 1]
}

const PATH = {
    DIR: "./plugins/music-share/",
    INSTALL: "./plugins/AddonsHelper/",
    PLUGINS: "./plugins/music-share/plugins/",
    LIB: {
        DIR: "./plugins/lib/ffmpeg"
    },

    INDEX: {
        DIR: "./plugins/music-share/index/",
        CONFIG: "./plugins/music-share/index/config.json",
        MUSIC_LIST: "./plugins/music-share/index/musicList.json",
        MUSIC_PACK: "./plugins/music-share/index/pack/",
        MUSIC_CONTENT: "./plugins/music-share/index/pack/content.json",
        //MUSIC_LOCK: "./plugins/music-share/index/pack/lock.json"
    },
    CACHE: {
        DIR: "./plugins/music-share/cache/",
        BUILD: "./plugins/music-share/cache/build/",
        PACK: "./plugins/music-share/cache/pack/"
    }
}

ll.registerPlugin(INFO.name, INFO.intro, INFO.version, INFO.other)

//GL 全局使用

//"deleteOldSound":true,
const GLConfig = new JsonConfigFile(PATH.INDEX.CONFIG,
    `{
    "soundPostfix" : "[mp3|flac]",
    "fmtArg":"-acodec libvorbis "
    "plugins":[
        {
            "index":"userGUI.js",
            "enable":false
        },
        {
            "index":"lrcLoad.js",
            "enable":false
        },
        {
            "index":"opMGR.js",
            "enable":false
        }
    ]
}`)
const GLMusicList = new JsonConfigFile(PATH.INDEX.MUSIC_LIST, "{}")



function packMain() {
    let Jcontent = new JsonConfigFile(PATH.INDEX.MUSIC_CONTENT, `
    {
        "_version_":${CONFIGINFO.VERSION},
        "pack":{},
        "reLoadList":[]
    }`)
    packCheck(Jcontent)
    updatePackList(Jcontent)
}


//检查content是否完整 转换其他格式为ogg格式 列出pack音乐列表
function packCheck(Jcontent) {
    let packlist = Jcontent.get("pack")
    for (let i in packlist) {
        //需要手动更新
        let needReload = false
        log("test packinit i", i)

        //check 完整检查

        //version
        logger.debug(packlist[i]["check"]["version"].toString())
        // why toStr -> [0,0,0] != [0,0,0]
        if (packlist[i]["check"]["version"].toString() == "0,0,0" || packlist[i]["check"]["version"] == undefined) {
            //logger.debug(versionAdd(packlist[i]["check"]["version"]))
            packlist[i]["check"]["version"] = versionAdd(packlist[i]["check"]["version"])
            needReload = true
        }

        //UUID
        if (packlist[i]["check"]["uuid"]["head"] == "" || packlist[i]["check"]["uuid"]["mod"] == "") {
            packlist[i]["check"]["uuid"]["head"] = radomUUID()
            packlist[i]["check"]["uuid"]["mod"] = radomUUID()
            needReload = true
        }

        //转换歌曲为ogg格式
        let packdir = PATH.INDEX.MUSIC_PACK + i
        //当前pack目录的音乐列表
        let musiclist = File.getFilesList(packdir + '/index/')
        let converlist = regA_Z(musiclist, GLConfig.get("soundPostfix"))[0]

        //如果有非ogg  并符合筛选标准的音乐
        if (converlist != []) {
            toOGG(PATH.INDEX.MUSIC_PACK + packlist[i]["index"] + '/index/', converlist)
            needReload = true
        }

        //比对 当前资源包的音乐列表 与 旧列表
        let Jchecklist = new JsonConfigFile(packdir + "/index/checklist.json", `{}`)
        if (File.exists(packdir + "/index/checklist.json")) {
            Jchecklist.set("_version_", CONFIGINFO.VERSION)
            Jchecklist.set("list", {})
        } else if (needReload == true) {
            //忽略需要更新的包
        } else {
            let checklist = Jchecklist.get("list")
            let nowlist = regA_Z(musiclist, "[ogg]",true)[0]
            if (!(checklist.length != nowlist.length)) {
                for (i in checklist) {
                    let haslist = false
                    for (let v = 0; v < nowlist; v++) {
                        if (checklist == nowlist[v]) {
                            haslist = true
                            break
                        }
                    }
                    if (haslist = false) {
                        needReload = true
                    }
                }
            } else {
                needReload = true
            }
        }
        Jchecklist.close()

        //将当前包是否需要更新 写入content
        if (needReload == true) {
            let arry = Jcontent.get("reLoadList")
            arry.push(i)
            logger.debug("update dir :", arry)
            Jcontent.set("reLoadList", arry)

        }

        logger.debug("check over :", packlist)
        Jcontent.set("pack", packlist)
    }
    logger.debug("check over: ", Jcontent.get("reLoadList"))
}

function updatePackList(Jcontent,) {
    //需要更新的包
    let updatelist = Jcontent.get("reLoadList")


    for (let i = 0; i < updatelist.length; i++) {
        let packlist = File.getFilesList(PATH.INDEX.MUSIC_PACK + updatelist[i] + "/index/")
        let cutPostfix = new RegExp("[.][ogg]")
        packlist = regA_Z(packCheck,"[ogg]")

        //传入cache临时目录 

        //去掉ogg 的文件名
        for (let i = 0;i<packlist.length;i++){
            packlist[i].replace(cutPostfix,"")
        }

        //打包到AddonsHelper

        //在musicList park 当前包代号：音乐列表

        //在musicList main 将全部包整合 写入
    }


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
    for (let i = 2; i > 0; i--) {
        if (version[i] < 9 && i != 0) {
            version[i] += 1
            logger.debug("version 1 ", version)
            break
        } else if (version[i] >= 9 && i != 0) {
            version[i] = 0
            version[i - 1] += 1
            logger.debug("version 2 ", version)
            break
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


function regA_Z(arry, postfix,cutPostfix) {
    let reg = new RegExp("^[A-z][A-z|_]*" + postfix + "$")
    let musiclist = []
    let outlist = []
    if (cutPostfix == true){
        cutPostfix = new RegExp("[.][ogg]")
    }
    for (let i = 0; i < arry.length; i++) {
        if (reg.test(arry) == true) {
            if(cutPostfix == true){
                musiclist.push(arry[i].replace(cutPostfix,""))
            }else {
                musiclist.push(arry[i])
            }
        } else {
            outlist.push(arry[i])
        }
    }
    return [musiclist, outlist]
}
function toOGG(path, fileArry) {
    let reg = new RegExp("[.][A-z]*$")
    for (let i = 0; i < fileArry.length; i++) {
        let outname = fileArry[i].replace(reg, ".ogg")
        system.newProcess("./plugins/lib/ffmpeg/ffmpeg.exe -i " +
            path + fileArry[i] + GLConfig.get("fmtArg") + path + outname
        )
        logger.info("已转换：", outname)
    }
}


mc.listen("onServerStarted", function () {
    let LMC = mc.newCommand("lfmusic", "音乐控制 导入 新建 music-share插件命令", PermType.GameMasters)
    LMC.setAlias("lmc")
    LMC.setEnum("build", ["build"])
    LMC.mandatory("OParg", ParamType.Enum, "build")
    LMC.overload(["build"])
    LMC.setCallback(function (_, ori, _, res) {
        switch (res.OParg) {
            case "build":
                packMain(ori)
                return
        }
    })
    LMC.setup()
})


