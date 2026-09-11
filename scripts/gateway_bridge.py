import serial
import serial.tools.list_ports
import json
import requests
import time
import sys

# Target Endpoint (Local dev or Vercel production URL)
API_ENDPOINT = "http://localhost:3000/api/gateway"
# For production: "https://project-sanket.vercel.app/api/gateway"

BAUD_RATE = 115200

def find_esp32_port():
    ports = serial.tools.list_ports.comports()
    for port in ports:
        desc = port.description.lower()
        if "cp210" in desc or "ch340" in desc or "usb-to-uart" in desc or "ttyusb" in desc or "ttyacm" in desc:
            return port.device
    return None

def main():
    print("\n=======================================================")
    print("  PROJECT SANKET: ESP32 OFFLINE GATEWAY SERIAL BRIDGE  ")
    print("=======================================================\n")

    port = find_esp32_port()
    if not port:
        # Fallback for Linux or manual selection
        port = "/dev/ttyUSB0" if sys.platform.startswith("linux") else "COM3"
        print(f"[!] Auto-detect failed. Falling back to default port: {port}")
    else:
        print(f"[*] Found hardware bridge on: {port}")

    try:
        ser = serial.Serial(port, BAUD_RATE, timeout=1)
        print(f"[*] Listening on {port} at {BAUD_RATE} baud...")
        print("[*] Waiting for offline victims to submit captive portal SOS...")
    except Exception as e:
        print(f"[X] Failed to open serial port {port}: {e}")
        print("    Ensure your user has dialout permissions (sudo usermod -a -G dialout $USER) and cable is plugged in.")
        return

    while True:
        try:
            raw_line = ser.readline().decode('utf-8', errors='ignore').strip()
            if not raw_line:
                continue

            # Look for JSON delimiter
            if raw_line.startswith('{') and raw_line.endswith('}'):
                print(f"\n[!] INCOMING HARDWARE PACKET: {raw_line}")
                try:
                    payload = json.loads(raw_line)
                    print(f"    Node: {payload.get('node_id')} | Victims: {payload.get('survivors')} | Priority: {payload.get('priority')}")
                    print(f"    Location: {payload.get('location')}")

                    # Forward to Sanket API
                    res = requests.post(API_ENDPOINT, json=payload, timeout=5)
                    if res.status_code == 200:
                        print("    [+] Successfully dispatched to Project Sanket CAD Cloud!")
                    else:
                        print(f"    [-] Forwarding failed with HTTP {res.status_code}: {res.text}")

                except json.JSONDecodeError:
                    print(f"    [-] Corrupt packet skipped: {raw_line}")
            else:
                # Debug logging output from ESP32 boot
                print(f"[ESP32 LOG]: {raw_line}")

        except KeyboardInterrupt:
            print("\nShutting down gateway bridge.")
            ser.close()
            break
        except Exception as err:
            print(f"[!] Serial loop error: {err}")
            time.sleep(1)

if __name__ == "__main__":
    main()
