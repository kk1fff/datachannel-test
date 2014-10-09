var SignalHandler = function() {
};

SignalHandler.prototype = {
  // As a signal handler.
  _target: null,
  setTarget: function(target) {
    this._target = target;
  },
  sendOffer: function(offer) {
    setTimeout(this._callOnOffer.bind(this, offer), 0);
  },
  sendAnswer: function(ans) {
    setTimeout(this._callOnAnswer.bind(this, ans), 0);
  },
  sendCandidate: function(candidate) {
    setTimeout(this._callOnCandidate.bind(this, candidate), 0);    
  },
  _callOnAnswer: function(ans) {
    this._target.recvAnswer(ans);
  },
  _callOnOffer: function(offer) {
    this._target.recvOffer(offer);
  },
  _callOnCandidate: function(cand) {
    this._target.recvCand(cand);
  },

  // As a target.
  onanswser: null,
  onoffer: null,
  recvAnswer: function(ans) {
    this.onanswser(ans);
  },
  recvOffer: function(offer) {
    this.onoffer(offer);
  },
  recvCand: function(cand) {
    this.oncandidate(cand);
  }
};

var Peer = function(signal_handler, id) {
  this._sh = signal_handler;
  this._sh.onanswser = this.recvAns.bind(this);
  this._sh.onoffer = this.recvOffer.bind(this);
  this._sh.oncandidate = this.recvCand.bind(this);
  this._id = id;
};

Peer.prototype = {
  setup: function () {
    var sh = this._sh;
    this._pc_conf = {
      iceServers: [
        {
          credential: "1234",
          url: "turn:10.247.24.48?transport=tcp",
          username: "patrick"
        }
      ]
    };
    this._pc = new window.mozRTCPeerConnection(this._pc_conf);
    var id = this._id;
    this._pc.addEventListener('icecandidate', function(e) {
      console.log("Candidate[" + id + "]: " + JSON.stringify(e.candidate));
      if (e.candidate) {
        sh.sendCandidate(e.candidate);
      }
    });
  },
  issueConnection: function() {
    var pc = this._pc;
    var sh = this._sh;
    this._pc.createDataChannel('testDataChannel',
                              { protocol: "text/plain",
                                negotiated: true });
    this._pc.createOffer(
      // Callback
      function (offer) {
        pc.setLocalDescription(
          offer,
          function() {
            console.log("Offer: " + JSON.stringify(offer));
            sh.sendOffer(offer);
          },
          function(e) {
            console.err("pc.setLocalDescription, fail: " + e);
          }
        );
      },
      // Error handler
      function(err) {
        console.err("pc.createOffer, fail: " + err);
      }
    );
  },

  recvOffer: function(offer) {
    var pc = this._pc;
    var sh = this._sh;
    this._pc.setRemoteDescription(
      offer,
      // Callback
      function () {
        pc.createAnswer(
          function (ans) {
            pc.setLocalDescription(
              ans,
              function() {
                console.log("Answer: " + JSON.stringify(ans));
                sh.sendAnswer(ans);
              },
              function(e) {
                console.log("pc.setLocalDescription, fail: " + e);
              }
            );
          },
          function (e) {
            console.log("pc.createAnswer, fail: " + e);
          }
        );
      },
      function (e) {
        console.err("pc.setRemoteDescription, fail: " + e);
      }
    );
  },
  recvAns: function(ans) {
    var pc = this._pc;
    pc.setRemoteDescription(
      ans,
      function() {

      },
      function(e) {
        console.err("pc.setRemoteDescription, fail: " + e);
      }
    );
  },
  recvCand: function(cand) {
    this._pc.addIceCandidate(cand);
  }
};

var peer1, peer2;
window.addEventListener('load', function() {
  var start_button = document.getElementById("btnstart");
  start_button.addEventListener('click', function() {
    // Create 2 signal handler and establish connection
    // between them.
    var sh1 = new SignalHandler(),
        sh2 = new SignalHandler();
    sh1.setTarget(sh2);
    sh2.setTarget(sh1);

    peer1 = new Peer(sh1, 1);
    peer1.setup();
    peer2 = new Peer(sh2, 2);
    peer2.setup();

    peer1.issueConnection();
  });
});
