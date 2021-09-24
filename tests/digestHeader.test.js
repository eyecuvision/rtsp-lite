const Digest = require("../src/Digest")
const RTSPClient = require("../src/RTSPClient")

const getDigestHeader = RTSPClient.getDigestHeader

const testMethod1 = (methodName,expected) => {
    it(`${methodName} test`, () => {
        const hash = getDigestHeader({
            username:"admin",
            password:"admin123",
            realm:"933a60f1c76d24634950229c",
            nonce:"5311c2cd4",
            uri:"rtsp://192.168.0.38:554/ISAPI/Streaming/channels/101",
            method:methodName
        })
        expect(hash)
            .toBe(expected) 
    })
    
}

const testMethod2 = (methodName,expected) => {
    it(`${methodName} test`, () => {
        const hash = getDigestHeader({
            username:"admin",
            password:"admin",
            realm:"Hipcam RealServer/V1.0",
            nonce:"5f7e1c472153eb6cc727db36f2d420bb",
            uri:"rtsp://192.168.0.30:554/11/",
            method:methodName
        })
        expect(hash)
            .toBe(expected) 
    })
    
}

const testMethod3 = (methodName,expected) => {
    it(`${methodName} test`, () => {
        const hash = getDigestHeader({
            username:"admin",
            password:"admin",
            realm:"Hipcam RealServer/V1.0",
            nonce:"5f7e1c472153eb6cc727db36f2d420bb",
            uri:"rtsp://192.168.0.30:554/11",
            method:methodName
        })
        expect(hash)
            .toBe(expected) 
    })
    
}


describe("Digest ",() => {

    
    testMethod1("DESCRIBE",`Digest username="admin", realm="933a60f1c76d24634950229c", nonce="5311c2cd4", uri="rtsp://192.168.0.38:554/ISAPI/Streaming/channels/101", response="c87e545c91371f190468a203b568bd93"`)
    testMethod1("OPTIONS",`Digest username="admin", realm="933a60f1c76d24634950229c", nonce="5311c2cd4", uri="rtsp://192.168.0.38:554/ISAPI/Streaming/channels/101", response="f3a1ce52e4ce5f4548b447698426a538"`)
    testMethod1("SETUP",`Digest username="admin", realm="933a60f1c76d24634950229c", nonce="5311c2cd4", uri="rtsp://192.168.0.38:554/ISAPI/Streaming/channels/101", response="9be2ced302258411032a4aae79f3fa46"`)
    testMethod1("PLAY",`Digest username="admin", realm="933a60f1c76d24634950229c", nonce="5311c2cd4", uri="rtsp://192.168.0.38:554/ISAPI/Streaming/channels/101", response="42d6a9e7c7c2876efd73d4f734b9752a"`)
    testMethod1("TEARDOWN",`Digest username="admin", realm="933a60f1c76d24634950229c", nonce="5311c2cd4", uri="rtsp://192.168.0.38:554/ISAPI/Streaming/channels/101", response="7d886c5d5c287964350de1432e4c31ee"`)
    
    testMethod2("SETUP",`Digest username="admin", realm="Hipcam RealServer/V1.0", nonce="5f7e1c472153eb6cc727db36f2d420bb", uri="rtsp://192.168.0.30:554/11/", response="18c55552aa363c05343954741625b75f"`)
    testMethod2("PLAY",`Digest username="admin", realm="Hipcam RealServer/V1.0", nonce="5f7e1c472153eb6cc727db36f2d420bb", uri="rtsp://192.168.0.30:554/11/", response="647ab28d6fc48a32299b50e3ec056866"`)
    testMethod2("TEARDOWN",`Digest username="admin", realm="Hipcam RealServer/V1.0", nonce="5f7e1c472153eb6cc727db36f2d420bb", uri="rtsp://192.168.0.30:554/11/", response="6975f3b5882573ce18ea39eff0dd5255"`)


    testMethod3("DESCRIBE",`Digest username="admin", realm="Hipcam RealServer/V1.0", nonce="5f7e1c472153eb6cc727db36f2d420bb", uri="rtsp://192.168.0.30:554/11", response="a2caa11bbeb22c81861999a1bbad6e20"`)

})