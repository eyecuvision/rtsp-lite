const RTSPClient = require("../src/RTSPClient")

const rtspDeviceAddress = ["192.168.0.30",554]
const unavailableAddress = ["192.168.0.169",554]
const nonRtspDeviceAddress = ["192.168.0.10",554]


describe("RTSP Client can " , () => {
    
    
    it("fetch options.", done => {
        const client = new RTSPClient(...rtspDeviceAddress)
        
        client.connect("/")
        .then(() => {
            client.options()
            .then(() => {
                client.destroy()
                done()
            })
        })
    })

    it("catch ECONNREFUSED.", done => {
        const client = new RTSPClient(...nonRtspDeviceAddress)

        try{
            client.connect("/")
            .then(() => done.fail("ECONNREFUSED should have been rejected."))
            .catch(done)

        }catch{
            throw new Error("ECONNREFUSED cannot be catched.")
        }finally{
            client.destroy()
        }
        
    },10000)

    it("timeouts on unavailable connection.", done => {
        const client = new RTSPClient(...unavailableAddress)

        try{
            client.connect("/")
            .then(() => done.fail("Unavailable connection should have been rejected."))
            .catch(done)

        }catch{
            throw new Error("Unavailable connection cannot be catched.")
        }finally{
            client.destroy()
        }
        
    },10000)

   
})