const RTSPClient = require("../src/RTSPClient")


describe("RTSP Client can " , () => {
    
    
    it("be constructed.",() => {

        const client = new RTSPClient("192.168.0.30",554)
    })

    it("fetch options.",(done) => {
        const client = new RTSPClient("192.168.0.30",554)
        
        client.connect("/")
        .then(() => {
            client.options()
            .then(() => {
                client.destroy()
                done()
            })
        })
    })
})