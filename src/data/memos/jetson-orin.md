# Jetson Orin

## Overview

This is (obviously) a Jetson Orin Nano Super. It is intended to be used for edge deployment and inference for RL and VLA things, perhaps connected to the Folly SO101 arm.

## There Is No Jetson AI Lab / Use jetson-containers instead

Nvidia's PyTorch packages server is constantly down (https://pypi.jetson-ai-lab.io/jp6/cu126). Turns out it is easier for everyone if you use the Docker images on dustynv/jetson-containers instead. 

## Specs

JetPack 6.2.1 / R36 (release), REVISION: 4.7


### Latest PyTorch image

```bash
jetson-containers run $(autotag l4t-pytorch)

# pip freeze
opencv-contrib-python==4.10.0+6a181ce
tensorrt @ file:///usr/src/tensorrt/python/tensorrt-10.4.0-cp310-none-linux_aarch64.whl#sha256=50269ba82908cae3b0f92bb311cd9189533664a360e60c68c5404b162eeb8924
torch==2.4.0
torch2trt @ file:///opt/torch2trt
torchaudio @ file:///opt/torchaudio-2.4.0a0%2B69d4077-cp310-cp310-linux_aarch64.whl#sha256=00b06beade545e71088ef0d73e1730a13291a853bf7da27e35697d63719bfa72
torchvision @ file:///opt/torchvision-0.19.0a0%2B48b1edf-cp310-cp310-linux_aarch64.whl#sha256=a988db3b18c5a17d64849e8937f4d59a6d040af394e7de0813abf4f8c7527e85
```

### RealSense?

`jetson-containers run dustynv/realsense:r36.2.0` runs (have to use python3, though). It does not have torch or numpy.

A naive read-frames operation fails currently, potentially due to power draw or something else:

```python
import pyrealsense2 as rs
import sys

def test_camera_connection():
    print("Attempting to connect to RealSense camera...")
    
    # Create a pipeline
    pipeline = rs.pipeline()
    
    try:
        # Start the pipeline with default configuration
        # If the camera is not mapped correctly, this will immediately throw a RuntimeError
        profile = pipeline.start()
        
        # Fetch the device from the active profile to prove hardware communication
        device = profile.get_device()
        cam_name = device.get_info(rs.camera_info.name)
        cam_serial = device.get_info(rs.camera_info.serial_number)
        
        print("\n✅ SUCCESS: Camera detected and streaming started!")
        print(f"📷 Device: {cam_name}")
        print(f"🔢 Serial: {cam_serial}")

        # Wait for exactly one frame to ensure data is flowing over the USB bus
        print("\nWaiting for initial frameset...") #fails after printing this
        frames = pipeline.wait_for_frames()
        
        # Grab the color frame
        color_frame = frames.get_color_frame()
        if color_frame:
            print(f"✅ SUCCESS: Grabbed a frame! (Resolution: {color_frame.get_width()}x{color_frame.get_height()})")
        else:
            print("⚠️ WARNING: Pipeline started, but color frame was empty.")

    except RuntimeError as e:
        print("\n❌ FAILED: Could not connect to the camera.")
        print(f"Error Details: {e}")
        print("\nTroubleshooting Checklist:")
        print("1. Did you run the setup_udev_rules.sh script on the host?")
        print("2. Did you pass -v /dev/bus/usb:/dev/bus/usb to the docker run command?")
        print("3. Did you pass --device /dev/video* to the docker run command?")
        sys.exit(1)
        
    except Exception as e:
        print(f"\n❌ FAILED: An unexpected error occurred: {e}")
        sys.exit(1)
        
    finally:
        # Always clean up the pipeline to release the USB endpoint
        try:
            pipeline.stop()
            print("\nPipeline stopped and resources released cleanly.")
        except Exception:
            pass # Ignore errors during shutdown if pipeline never fully started

if __name__ == "__main__":
    test_camera_connection()
```

```
Waiting for initial frameset...
double free or corruption (out)
Aborted (core dumped)
```

Not a power issue, may have to force `RS2_USE_V4L2_BACKEND=0` or something like that.
```
[Mon May 25 10:15:01 2026] uvcvideo 2-1.2:1.1: Unknown video format 00000050-0000-0010-8000-00aa00389b71
[Mon May 25 10:15:01 2026] usb 2-1.2: Found UVC 1.50 device Intel(R) RealSense(TM) Depth Camera 405  (8086:0b5b)
[Mon May 25 10:15:01 2026] input: Intel(R) RealSense(TM) Depth Ca as /devices/platform/bus@0/3610000.usb/usb2/2-1/2-1.2/2-1.2:1.0/input/input6
[Mon May 25 10:15:01 2026] uvcvideo 2-1.2:1.1: Unknown video format 00000050-0000-0010-8000-00aa00389b71
[Mon May 25 10:15:01 2026] usb 2-1.2: Found UVC 1.50 device Intel(R) RealSense(TM) Depth Camera 405  (8086:0b5b)
[Mon May 25 10:15:01 2026] input: Intel(R) RealSense(TM) Depth Ca as /devices/platform/bus@0/3610000.usb/usb2/2-1/2-1.2/2-1.2:1.0/input/input7
[Mon May 25 10:15:01 2026] uvcvideo 2-1.2:1.1: Unknown video format 00000050-0000-0010-8000-00aa00389b71
[Mon May 25 10:15:01 2026] usb 2-1.2: Found UVC 1.50 device Intel(R) RealSense(TM) Depth Camera 405  (8086:0b5b)
[Mon May 25 10:15:02 2026] input: Intel(R) RealSense(TM) Depth Ca as /devices/platform/bus@0/3610000.usb/usb2/2-1/2-1.2/2-1.2:1.0/input/input8
[Mon May 25 10:15:13 2026] uvcvideo 2-1.2:1.1: Unknown video format 00000050-0000-0010-8000-00aa00389b71
[Mon May 25 10:15:13 2026] usb 2-1.2: Found UVC 1.50 device Intel(R) RealSense(TM) Depth Camera 405  (8086:0b5b)
[Mon May 25 10:15:13 2026] input: Intel(R) RealSense(TM) Depth Ca as /devices/platform/bus@0/3610000.usb/usb2/2-1/2-1.2/2-1.2:1.0/input/input9
[Mon May 25 10:15:13 2026] uvcvideo 2-1.2:1.1: Unknown video format 00000050-0000-0010-8000-00aa00389b71
[Mon May 25 10:15:13 2026] usb 2-1.2: Found UVC 1.50 device Intel(R) RealSense(TM) Depth Camera 405  (8086:0b5b)
[Mon May 25 10:15:13 2026] input: Intel(R) RealSense(TM) Depth Ca as /devices/platform/bus@0/3610000.usb/usb2/2-1/2-1.2/2-1.2:1.0/input/input10
[Mon May 25 10:15:13 2026] uvcvideo 2-1.2:1.1: Unknown video format 00000050-0000-0010-8000-00aa00389b71
[Mon May 25 10:15:13 2026] usb 2-1.2: Found UVC 1.50 device Intel(R) RealSense(TM) Depth Camera 405  (8086:0b5b)
[Mon May 25 10:15:13 2026] input: Intel(R) RealSense(TM) Depth Ca as /devices/platform/bus@0/3610000.usb/usb2/2-1/2-1.2/2-1.2:1.0/input/input11
```