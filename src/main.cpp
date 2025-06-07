/* Exemplo de comunicação usando o protocolo websockets com ESP32 e página HTTP websockets. Baseado nos tutoriais:

https://randomnerdtutorials.com/esp32-websocket-server-arduino/
https://randomnerdtutorials.com/esp32-websocket-server-sensor/

e no repositório:

https://github.com/josenalde/ui-control-websocket-esp32

*/
#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <Arduino_JSON.h>
#include <freertos/FreeRTOS.h>

//Definições:

      //Nome e senha da rede a se conectar
      const char* WIFI_SSID = "A10s";
      const char* WIFI_PASSWORD = "Deivison1993";

      // Create a WebSocket object
      WebSocketsServer websocketServer = WebSocketsServer(8080);
      WebServer webServer(80);

      //define os pinos dos leds e seus estados
      static const uint8_t Led1 = 26;
      static const uint8_t Led2 = 27;

      bool led1State = false;
      bool led2State = false;

      //define uma variavel do tipo json para armazenar o que vai ser enviado ao cliente
      JSONVar readings;

      // Variaveis de tempo
      unsigned long lastTime = 0;
      unsigned long timerDelay = 5000;


// Callbacks
void notifyClients(String sensorReadings) {
  websocketServer.broadcastTXT(sensorReadings);
}

void getSensorReadings() {
  if(digitalRead(Led1) == HIGH){
    readings = "On";
    led1State = true;
  }
  else{
    readings = "Off";
    led1State = false;
  }

  notifyClients(readings);
  //websocketserver.cleanupClients(); // in order to avoid exceeding maximum clients - a timer for this is necessary
}

//pagina html dentro do codigo
const char index_html[] PROGMEM = R"rawliteral(
    <!DOCTYPE HTML>
<html>
<head>
  <title>ESP Web Server</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="data:,">
  <style>
  html {
    font-family: Arial, Helvetica, sans-serif;
    text-align: center;
  }
  h1 {
    font-size: 1.8rem;
    color: white;
  }
  h2{
    font-size: 1.5rem;
    font-weight: bold;
    color: #143642;
  }
  .topnav {
    overflow: hidden;
    background-color: #143642;
  }
  body {
    margin: 0;
  }
  .content {
    padding: 30px;
    max-width: 600px;
    margin: 0 auto;
  }
  .card {
    background-color: #F8F7F9;;
    box-shadow: 2px 2px 12px 1px rgba(140,140,140,.5);
    padding-top:10px;
    padding-bottom:20px;
  }
  .button {
    padding: 15px 50px;
    font-size: 24px;
    text-align: center;
    outline: none;
    color: #fff;
    background-color: #0f8b8d;
    border: none;
    border-radius: 5px;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-tap-highlight-color: rgba(0,0,0,0);
   }
   .button:active {
     background-color: #0f8b8d;
     box-shadow: 2 2px #CDCDCD;
     transform: translateY(2px);
   }
   .state {
     font-size: 1.5rem;
     color:#8c8c8c;
     font-weight: bold;
   }
  </style>
<title>ESP Web Server</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="data:,">
</head>
<body>
  <div class="topnav">
    <h1>ESP WebSocket Server</h1>
  </div>
  <div class="content">
    <div class="card">
      <h2>Output - GPIO 26</h2>
      <p class="state">state: <span id="state">%STATE%</span></p>
      <p><button id="button" class="button">Toggle</button></p>
    </div>
  </div>

  <div class="content">
    <div class="card">
      <h2>Output - GPIO 27</h2>
      <p class="state">state: <span id="state">%STATE%</span></p>
      <p><button id="button" class="button">Toggle</button></p>
    </div>
  </div>
  
<script>
  var gateway = `ws://${window.location.hostname}/ws`;
  var websocket;
  function initWebSocket() {
    console.log('Trying to open a WebSocket connection...');
    websocket = new WebSocket(gateway);
    websocket.onopen    = onOpen;
    websocket.onclose   = onClose;
    websocket.onmessage = onMessage; // <-- add this line
  }
  function onOpen(event) {
    console.log('Connection opened');
  }

  function onClose(event) {
    console.log('Connection closed');
    setTimeout(initWebSocket, 2000);
  }
  function onMessage(event) {
    var state;
    if (event.data == "1"){
      state = "ON";
    }
    else{
      state = "OFF";
    }
    document.getElementById('state').innerHTML = state;
  }
  window.addEventListener('load', onLoad);
  function onLoad(event) {
    initWebSocket();
    initButton();
  }

  function initButton() {
    document.getElementById('button').addEventListener('click', toggle);
  }
  function toggle(){
    websocket.send('toggle');
  }
</script>
</body>
</html>
)rawliteral";

//------------------------------------------------------------------------------------------------------

void sendHtml(){
  String data = webServer.uri(); 
     if (data=="/") {
       digitalWrite(MV_PIN, LOW);
       digitalWrite(FLAG_DISCHARGE_PIN, HIGH);
       vTaskDelay(pdMS_TO_TICKS(timeConstant*4*1000)); //RC * 4 * 1000 to get in ms
       digitalWrite(FLAG_DISCHARGE_PIN, LOW);
       webserver.send(200,"text/plain","ok");
     }
}

// Initialize WiFi (padrão)
void initWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi ..");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print('.');
    vTaskDelay(pdMS_TO_TICKS(1000));
  }
  Serial.println(WiFi.localIP());
}

void initWebSocket() {
  websocketServer.begin();
  websocketServer.onEvent(onWebSocketEvent);
}

void onWebSocketEvent(uint8_t num, WStype_t type, uint8_t *payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] disconnected\n", num);
      break;
    case WStype_CONNECTED: {
      IPAddress ip = websocketServer.remoteIP(num);
      Serial.printf("[%u] connection from ", num);
      Serial.println(ip.toString());
    }
      break;
    case WStype_TEXT:
      Serial.printf("[%u] Text: %s\n", num, payload) ;
      notifyClients(String(led1State));
      //websocketserver.sendTXT(num, payload); //send payload back to the client
      break;
    case WStype_ERROR:
    case WStype_BIN:
    case WStype_FRAGMENT_TEXT_START:
    case WStype_FRAGMENT_BIN_START:
    case WStype_FRAGMENT:
    case WStype_FRAGMENT_FIN:
    default: break;
  }
}

//-----------------------------------------------------------------
void setup(void) {
  pinMode(Led1, OUTPUT);
  pinMode(Led2, OUTPUT);

  digitalWrite(Led1, LOW);
  digitalWrite(Led2, LOW);
  
  initWiFi();
  initWebSocket();

  webServer.on("/", sendHtml);
  webServer.begin();
}

void loop(void) {
  webServer.handleClient();
  websocketServer.loop();
}
