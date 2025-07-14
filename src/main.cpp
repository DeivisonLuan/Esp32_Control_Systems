/* Exemplo de comunicação usando o protocolo websockets com ESP32 e página HTTP websockets. Baseado nos tutoriais:

https://randomnerdtutorials.com/esp32-websocket-server-arduino/
https://randomnerdtutorials.com/esp32-websocket-server-sensor/

e no repositório:

https://github.com/josenalde/ui-control-websocket-esp32

*/
#include <Arduino.h>
#include <Arduino_JSON.h>
#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <freertos/FreeRTOS.h>
#include "SPIFFS.h"

//Definições:
      //Nome e senha da rede a se conectar
      const char* WIFI_SSID = "brisa-1849366";
      const char* WIFI_PASSWORD = "vcmgnixs";

      // Create a WebSocket object
      WebSocketsServer websocketServer = WebSocketsServer(8080);
      WebServer webServer(80);

      //Definindo variaveis relacionadas ao resistor e capacitor
      static const float R = 10000; //10k Ohms
      static const float C = 0.0001; //100 uF Faraday
      static const float timeConst = R*C;
      static const TickType_t samplingInterval = ((timeConst*1000)/10.) / portTICK_PERIOD_MS; // 100ms = 0.1s
      static const TickType_t timeToApplyMV = (timeConst*4*1000) / portTICK_PERIOD_MS; 

      //Variaveis Globais
      static const uint8_t SENSOR_PIN = 34;
      static const uint8_t MV_PIN = 25;
      static const uint8_t FLAG_DISCHARGE_PIN = 2;
      volatile float VCC = 0.0; //Valor inicial aplicado em t=0 para t=timeToApplyMV
      volatile uint16_t sensorReadingInt;
      volatile float sensorReadingVoltage;

      static TimerHandle_t getSensorReadingTimer = NULL;
      static TimerHandle_t stepInputStartTimer = NULL;

      //define uma variavel do tipo json para armazenar o que vai ser enviado ao cliente
      JSONVar readings;
      String jsonString; //Armazena os dados da variavel JSON numa String para manipular mais fácil
      

      // Variaveis de tempo
      unsigned long lastTime = 0;
      unsigned long timerDelay = 5000;
      unsigned long refreshInterval = ((timeConst*1000)/10.);

// Callbacks
void notifyClients(String sensorReadings) {
  websocketServer.broadcastTXT(sensorReadings);
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
      notifyClients(jsonString);
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

void getSensorReadingCallback(TimerHandle_t xTimer) {
  readings["time"] = String(xTaskGetTickCount() / 1000.);
  sensorReadingInt = analogRead(SENSOR_PIN);
  sensorReadingVoltage = (sensorReadingInt) * (VCC/4096.);
  readings["MV"] =  String(VCC);
  readings["PV"] =  String(sensorReadingVoltage);
  Serial.print(xTaskGetTickCount() / 1000., 1);
  Serial.print(",");
  Serial.print(VCC);
  Serial.print(",");
  Serial.println(sensorReadingVoltage, 1);
  jsonString = JSON.stringify(readings);
  notifyClients(jsonString);
  //websocketserver.cleanupClients(); // in order to avoid exceeding maximum clients - a timer for this is necessary
}

// Envia um degrau depois de <timeToStartInterval> segundos
void setStepInputReadingCallback(TimerHandle_t xTimer) {
  digitalWrite(MV_PIN, HIGH);
  VCC = 3.3;
}

void initSPIFFS() {
  if (!SPIFFS.begin(true)) {
    Serial.println("An error has occurred while mounting LittleFS");
  }
  Serial.println("LittleFS mounted successfully");
}

//Inicializa WiFi (padrão)
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

// Usa o button@frontend para resetar o capacitor (descarregar)
  void dischargeCapacitor() { 
     String data = webServer.uri(); 
     if (data=="/discharge") {
       digitalWrite(MV_PIN, LOW);
       digitalWrite(FLAG_DISCHARGE_PIN, HIGH);
       vTaskDelay(pdMS_TO_TICKS(timeConst*4*1000)); //RC * 4 * 1000 to get in ms
       digitalWrite(FLAG_DISCHARGE_PIN, LOW);
       webServer.send(200,"text/plain","ok");
     } 
  }

//-----------------------------------------------------------------
void setup(void) {
  pinMode(MV_PIN, OUTPUT);
  pinMode(SENSOR_PIN, INPUT);
  pinMode(FLAG_DISCHARGE_PIN, OUTPUT);

  Serial.begin(115200);
  initWiFi();
  initSPIFFS();
  initWebSocket();

  webServer.serveStatic("/", SPIFFS, "/index.html");
  webServer.serveStatic("/style.css", SPIFFS, "/style.css");
  webServer.serveStatic("/script.js", SPIFFS, "/script.js");
  webServer.on("/discharge", dischargeCapacitor);
  webServer.begin();

  // Create a auto-reload timer for sensor readings
  getSensorReadingTimer = xTimerCreate(
                      "getSensorReadingTimer",     // Name of timer
                      samplingInterval,            // Period of timer (in ticks)
                      pdTRUE,              // Auto-reload TRUE, one_shot FALSE
                      (void *)0,            // Timer ID
                      getSensorReadingCallback);  // Callback function
  // Create a one shot timer for step output
  stepInputStartTimer  = xTimerCreate(
                      "stepInputStartTimer ",     // Name of timer
                      timeToApplyMV,            // Period of timer (in ticks)
                      pdFALSE,              // Auto-reload TRUE, one_shot FALSE
                      (void *)1,            // Timer ID
                      setStepInputReadingCallback);  // Callback function

  xTimerStart(getSensorReadingTimer, 0);
  xTimerStart(stepInputStartTimer, 0);
}

void loop(void) {
  webServer.handleClient();
  websocketServer.loop();
}
