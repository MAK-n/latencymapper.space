"""
Heatmap Frame Receiver Client

Connects to heatmap server via WebSocket and receives generated frames in real-time.

Usage:
    py heatmap_client.py --server http://localhost:5000 --output received_frames
"""

import argparse
import json
import base64
from pathlib import Path
import time
from websocket import create_connection, WebSocketTimeoutException


class HeatmapClient:
    def __init__(self, server_url="https://knox-swainish-wonderingly.ngrok-free.dev", output_dir="output/received_frames"):
        self.server_url = server_url.replace("http://", "").replace("https://", "")
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.frames_received = 0
        self.total_frames = 0
        
        print(f"Heatmap Receiver Client")
        print(f"  Server: {self.server_url}")
        print(f"  Output: {self.output_dir.absolute()}")
    
    def initialize_backend(self, satellite_file, config=None):
        """Initialize backend with satellite data"""
        import requests
        
        print(f"\nInitializing backend with satellite data from {satellite_file}")
        
        # Read satellite data
        with open(satellite_file, 'r') as f:
            satellites = json.load(f)
        
        payload = {
            "satellites": satellites,
            "config": config or {}
        }
        
        try:
            response = requests.post(
                f"https://{self.server_url}/api/initialize",
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            print(f"✓ Backend initialized")
            print(f"  Satellites: {result.get('satellite_count', 0)}")
            return True
            
        except Exception as e:
            print(f"✗ Failed to initialize: {e}")
            return False
    
    def start_generation(self, duration_seconds=3600, step_seconds=10, start_time=None):
        """Request server to start generating heatmaps"""
        import requests
        
        print(f"\nRequesting heatmap generation")
        print(f"  Duration: {duration_seconds}s")
        print(f"  Step: {step_seconds}s")
        
        payload = {
            "duration_seconds": duration_seconds,
            "step_seconds": step_seconds,
            "start_time": start_time
        }
        
        try:
            response = requests.post(
                f"https://{self.server_url}/api/generate",
                json=payload,
                timeout=10
            )
            response.raise_for_status()
            result = response.json()
            
            self.total_frames = result.get("total_frames", 0)
            
            print(f"✓ Generation started")
            print(f"  Total frames: {self.total_frames}")
            return True
            
        except Exception as e:
            print(f"✗ Failed to start generation: {e}")
            return False
    
    def receive_frames(self):
        """Connect to WebSocket and receive frames"""
        ws_url = f"wss://{self.server_url}/ws/frames"
        
        print(f"\nConnecting to WebSocket: {ws_url}")
        
        try:
            ws = create_connection(ws_url, timeout=10)
            print("✓ WebSocket connected")
            
            print("\nReceiving frames...")
            
            while True:
                try:
                    message = ws.recv()
                    data = json.loads(message)
                    
                    msg_type = data.get("type")
                    
                    if msg_type == "status":
                        status = data.get("data", {})
                        print(f"  Status: {status.get('status', 'unknown')}")
                        
                    elif msg_type == "frame":
                        index = data.get("index")
                        total = data.get("total")
                        filename = data.get("filename")
                        timestamp = data.get("timestamp")
                        frame_base64 = data.get("data")
                        
                        # Decode and save frame
                        frame_bytes = base64.b64decode(frame_base64)
                        frame_path = self.output_dir / filename
                        frame_path.write_bytes(frame_bytes)
                        
                        self.frames_received += 1
                        
                        if self.frames_received % 10 == 0 or self.frames_received == total:
                            print(f"  Received {self.frames_received}/{total} frames", end='\r')
                        
                    elif msg_type == "complete":
                        total = data.get("total_frames")
                        print(f"\n✓ Transfer complete: {total} frames received")
                        break
                        
                except WebSocketTimeoutException:
                    print("⚠ WebSocket timeout")
                    break
                except Exception as e:
                    print(f"✗ Error receiving frame: {e}")
                    break
            
            ws.close()
            print("✓ WebSocket closed")
            
            # Save metadata
            metadata_path = self.output_dir / "metadata.txt"
            with open(metadata_path, 'w') as f:
                f.write(f"Frames Received: {self.frames_received}\n")
                f.write(f"Total Expected: {self.total_frames}\n")
                f.write(f"Output Directory: {self.output_dir.absolute()}\n")
            
            print(f"\n✓ Metadata saved: {metadata_path.absolute()}")
            
        except Exception as e:
            print(f"✗ WebSocket connection failed: {e}")


def main():
    parser = argparse.ArgumentParser(description="Heatmap Frame Receiver Client")
    parser.add_argument("--server", default="https://knox-swainish-wonderingly.ngrok-free.dev", help="Server URL")
    parser.add_argument("--output", default="output/received_frames", help="Output directory")
    parser.add_argument("--satellite-file", help="Path to satellite JSON file (for initialization)")
    parser.add_argument("--duration", type=int, default=3600, help="Duration in seconds")
    parser.add_argument("--step", type=int, default=10, help="Step size in seconds")
    parser.add_argument("--start-time", help="Start time (ISO format)")
    parser.add_argument("--skip-init", action="store_true", help="Skip initialization")
    parser.add_argument("--skip-generate", action="store_true", help="Skip generation request (just receive)")
    
    args = parser.parse_args()
    
    # Initialize client
    client = HeatmapClient(
        server_url=args.server,
        output_dir=args.output
    )
    
    # Initialize backend
    if not args.skip_init:
        if not args.satellite_file:
            print("✗ Error: --satellite-file required for initialization")
            return
        
        if not client.initialize_backend(args.satellite_file):
            print("✗ Initialization failed. Exiting.")
            return
        
        time.sleep(1)  # Brief delay after initialization
    
    # Start generation
    if not args.skip_generate:
        if not client.start_generation(
            duration_seconds=args.duration,
            step_seconds=args.step,
            start_time=args.start_time
        ):
            print("✗ Failed to start generation. Exiting.")
            return
        
        time.sleep(2)  # Wait for generation to start
    
    # Receive frames via WebSocket
    client.receive_frames()
    
    print("\n" + "=" * 60)
    print("Transfer complete!")
    print(f"Frames saved to: {client.output_dir.absolute()}")
    print("=" * 60)


if __name__ == "__main__":
    main()