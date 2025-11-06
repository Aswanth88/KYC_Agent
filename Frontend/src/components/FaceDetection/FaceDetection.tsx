import React, { useRef, useEffect, useState } from "react";
import { FaceDetection } from "@mediapipe/face_detection";
import { Camera } from "@mediapipe/camera_utils";
import { Camera as CameraIcon, Upload, Check, X, Loader2, Scan, User, Building, Mail, Phone, Globe } from "lucide-react";
import { useAuth } from '../../hooks/useAuth';

interface Lead {
  name?: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
  address?: string;
  industry?: string;
  website?: string;
  social_media?: Record<string, string>;
  additional_info?: string;
}

interface FaceVerificationProps {
  onVerified?: (success: boolean, extractedData?: Lead[]) => void;
  onDataExtracted?: (data: Lead[]) => void;
  prefillData?: (data: any) => void; // NEW: Callback to prefill parent form
}

export const FaceVerification: React.FC<FaceVerificationProps> = ({ 
  onVerified, 
  onDataExtracted,
  prefillData // NEW: Add prefill callback
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [liveDetected, setLiveDetected] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractingData, setExtractingData] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [livenessDone, setLivenessDone] = useState(false);
  const [extractedLeads, setExtractedLeads] = useState<Lead[]>([]);
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const [selectedLeadIndex, setSelectedLeadIndex] = useState(0);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const { getAuthHeaders } = useAuth();

  const notify = (msg: string) => {
    console.log("Status:", msg);
    setStatusMsg(msg);
  };

  // NEW: Function to prefill form data
  const prefillFormWithLeadData = (leads: Lead[]) => {
    if (leads.length > 0 && prefillData) {
      const lead = leads[selectedLeadIndex];
      const formData = {
        // Map lead data to form fields
        fullName: lead.name || '',
        company: lead.company || '',
        jobTitle: lead.title || '',
        email: lead.email || '',
        phoneNumber: lead.phone || '',
        address: lead.address || '',
        industry: lead.industry || '',
        website: lead.website || '',
        // Add other fields as needed
      };
      prefillData(formData);
      console.log("📝 Prefilled form with:", formData);
    }
  };

  // Add Lead extraction function
  const extractLeadsData = async (file: File): Promise<Lead[]> => {
  setExtractingData(true);
  setExtractedLeads([]);
  try {
    const formData = new FormData();
    formData.append('document', file);
    
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
      'Authorization': token ? `Bearer ${token}` : '',
    };

    // For KYC flow, only extract KYC data, not leads
    notify("🔄 Extracting KYC data from document...");
    
    const kycResponse = await fetch(`${API_BASE_URL}/extract-kyc-data`, {
      method: 'POST',
      body: formData,
      headers: headers,
    });

    if (kycResponse.ok) {
      const kycResult = await kycResponse.json();
      console.log("🎯 KYC Extraction Result:", kycResult);
      
      if (kycResult.success && kycResult.kyc_data) {
        prefillFormWithKYCData(kycResult.kyc_data);
        notify("✅ KYC data extracted successfully!");
        
        // Return empty leads since this is KYC, not business cards
        return [];
      }
    }
    
    console.log("❌ KYC extraction failed");
    return [];
  } catch (err) {
    console.error('Extraction error:', err);
    notify("⚠️ Could not extract data automatically.");
    return [];
  } finally {
    setExtractingData(false);
  }
};

// NEW: Function to prefill form with KYC data
const prefillFormWithKYCData = (kycData: any) => {
  if (prefillData) {
    console.log("📝 Raw KYC Data received:", kycData);
    
    // Map the KYC data to form fields with better handling
    const formData = {
      // Handle name - could be array or string
      name: Array.isArray(kycData.name) ? kycData.name : 
            kycData.name ? [kycData.name] : [],
      
      // Handle gender - map to your form's expected values
      gender: kycData.gender ? 
              (kycData.gender.toLowerCase().includes('male') ? 'Male' : 
               kycData.gender.toLowerCase().includes('female') ? 'Female' : kycData.gender) : null,
      
      // Date of birth - ensure proper format
      dateOfBirth: kycData.date_of_birth || kycData.dob || null,
      
      // Mobile number
      mobileNumber: kycData.mobile_number || kycData.phone || kycData.mobile || null,
      
      // Aadhaar number
      aadhaarNumber: kycData.aadhaar_number || kycData.aadhaar || kycData.uid || null,
      
      // Address
      address: kycData.address || null,
      
      // PAN number
      panNumber: kycData.pan_number || kycData.pan || null
    };
    
    console.log("📝 Mapped form data:", formData);
    prefillData(formData);
  }
};

  // NEW: Update prefill when selected lead changes
  useEffect(() => {
    if (extractedLeads.length > 0) {
      prefillFormWithLeadData(extractedLeads);
    }
  }, [selectedLeadIndex, extractedLeads]);

  /** 🎥 Start Webcam */
  const handleStartCamera = async () => {
    try {
      if (videoRef.current?.srcObject) {
        const oldStream = videoRef.current.srcObject as MediaStream;
        oldStream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        if (canvasRef.current && videoRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
        }
      }

      setCameraActive(true);
      setLiveDetected(false);
      setLivenessDone(false);
      notify("Camera started. Please look into the camera...");
    } catch (err: any) {
      console.error("Camera access error:", err);
      alert(`Camera error: ${err.message}`);
    }
  };

  /** 🧠 Setup Face Detection + Liveness */
  useEffect(() => {
    if (!cameraActive) return;

    const faceDetection = new FaceDetection({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
    });

    faceDetection.setOptions({
      selfieMode: true,
      model: "short",
      minDetectionConfidence: 0.5,
    } as any);

    faceDetection.onResults((results: any) => {
      if (!canvasRef.current || !videoRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(
        results.image,
        0, 0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      if (results.detections?.length > 0) {
        if (!faceDetected) {
          setFaceDetected(true);
          notify("✅ Face detected! Checking liveness...");
        }
        const box = results.detections[0].boundingBox;
        if (box) {
          ctx.strokeStyle = "lime";
          ctx.lineWidth = 3;
          ctx.strokeRect(
            box.xCenter * canvasRef.current.width -
            (box.width * canvasRef.current.width) / 2,
            box.yCenter * canvasRef.current.height -
            (box.height * canvasRef.current.height) / 2,
            box.width * canvasRef.current.width,
            box.height * canvasRef.current.height
          );
        }
      } else {
        if (faceDetected) {
          setFaceDetected(false);
          notify("❌ Face lost. Please look into the camera.");
        }
      }
    });

    const camera = new Camera(videoRef.current!, {
      onFrame: async () => {
        if (videoRef.current) {
          await faceDetection.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480,
    });

    camera.start();

    const livenessInterval = setInterval(() => {
      if (videoRef.current && faceDetected && !livenessDone && cameraActive) {
        sendLivenessFrame();
      }
    }, 500);

    return () => {
      clearInterval(livenessInterval);
      camera.stop();
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [cameraActive, faceDetected, livenessDone]);

  /** 🧠 Send frame for liveness detection */
  const sendLivenessFrame = async () => {
    if (!videoRef.current || livenessDone) return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg")
      );
      if (!blob) return;

      const formData = new FormData();
      formData.append("frame", blob, "frame.jpg");
      formData.append("user_id", "user123");

      const res = await fetch(`${API_BASE_URL}/liveness-webcam`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Liveness check failed");

      const data = await res.json();
      console.log("Liveness result:", data);

      if (data.live) {
        setLiveDetected(true);
        setLivenessDone(true);
        notify("✅ Liveness confirmed! You can now verify.");
      } else if (data.reason === "collecting_frames") {
        // Don't spam notifications for collecting frames
        if (data.frames_collected % 5 === 0) {
          notify(`⏳ Collecting frames... (${data.frames_collected})`);
        }
      } else if (data.reason === "No face detected") {
        notify("⚠️ Please keep your face in view.");
      }
    } catch (err) {
      console.error("Liveness error:", err);
      // Don't show error for every failed frame
    }
  };

  /** 🧠 Handle Document Upload */
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        notify("❌ Please upload an image file");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        notify("❌ File size should be less than 5MB");
        return;
      }
      
      setDocumentFile(file);
      setSelectedLeadIndex(0); // Reset to first lead
      
      // Reset the input value to allow uploading the same file again
      e.target.value = '';
      
      // Automatically extract data when document is uploaded
      await extractLeadsData(file);
    }
  };

  /** 🧠 Verify Selfie vs Document Photo */
  const handleVerify = async () => {
    if (!documentFile) {
      notify("❌ Please upload your document first.");
      return;
    }
    
    if (!liveDetected) {
      notify("❌ Please wait for liveness detection to complete.");
      return;
    }

    setLoading(true);
    setVerificationAttempted(true);
    notify("🔄 Verifying face match...");

    try {
      if (!videoRef.current) {
        throw new Error("Camera not available");
      }

      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas context");
      
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const selfieBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg")
      );

      if (!selfieBlob) {
        throw new Error("Could not capture selfie image");
      }

      const formData = new FormData();
      formData.append("selfie", selfieBlob, "selfie.jpg");
      formData.append("idphoto", documentFile);
      formData.append("model", "ArcFace");
      formData.append("detector", "retinaface");

      const token = localStorage.getItem("auth_token");
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/verify`, {
        method: "POST",
        body: formData,
        headers: headers,
      });

      if (res.status === 401) {
        throw new Error("Authentication failed. Please log in again.");
      }

      if (!res.ok) {
        throw new Error(`Server error: ${res.status} - ${res.statusText}`);
      }

      const data = await res.json();
      console.log("Verification result:", data);

      if (data.verified === true || data.verified === 'true') {
        notify("✅ Face verified successfully! Moving to next step...");
        onVerified?.(true, extractedLeads);
      } else {
        let distanceMessage = '';
        if (typeof data.distance === 'number') {
          distanceMessage = ` (Similarity: ${(1 - data.distance).toFixed(2)})`;
        }

        notify(`❌ Face does not match document photo.${distanceMessage}`);
        onVerified?.(false, extractedLeads);
      }
    } catch (err) {
      console.error('Verification error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      notify(`❌ ${errorMessage}`);
      onVerified?.(false, extractedLeads);
    } finally {
      setLoading(false);
    }
  };

  // Reset states when component mounts
  useEffect(() => {
    setCameraActive(false);
    setFaceDetected(false);
    setLiveDetected(false);
    setLivenessDone(false);
    setVerificationAttempted(false);
  }, []);

  const currentLead = extractedLeads[selectedLeadIndex];

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-4 text-center">
        Document Verification & Data Extraction
      </h1>

      {!cameraActive && (
        <button
          onClick={handleStartCamera}
          className="px-4 py-2 bg-blue-600 text-white rounded-md mb-4 flex items-center mx-auto hover:bg-blue-700 transition-colors"
        >
          <CameraIcon className="mr-2" /> Start Camera
        </button>
      )}

      {cameraActive && (
        <div className="relative w-full max-w-2xl mx-auto mb-4">
          <video
            ref={videoRef}
            className="w-full rounded-lg border-2 border-gray-300"
            playsInline
            autoPlay
            muted
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />
        </div>
      )}

      <div className="mt-4 flex justify-center">
        <div className="text-center">
          <label className={`flex flex-col items-center px-6 py-4 rounded-md cursor-pointer transition-colors ${
            extractingData 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}>
            <Upload className="mr-2" />
            Upload Document/Business Card
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleDocumentUpload}
              className="hidden"
              disabled={extractingData}
            />
          </label>
          <p className="text-sm text-gray-600 mt-2 max-w-xs">
            📄 We'll automatically extract contact information and prefill your form
          </p>
        </div>
      </div>

      {/* Extraction Status */}
      {extractingData && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center text-blue-700">
            <Scan className="h-4 w-4 mr-2 animate-pulse" />
            Extracting data from document...
          </div>
        </div>
      )}

      {/* Extracted Leads Display */}
      {extractedLeads.length > 0 && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center text-green-700">
              <Check className="h-4 w-4 mr-2" />
              {extractedLeads.length} Lead(s) Extracted
            </div>
            {extractedLeads.length > 1 && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedLeadIndex(prev => Math.max(0, prev - 1))}
                  disabled={selectedLeadIndex === 0}
                  className="px-2 py-1 text-xs bg-green-200 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-green-700">
                  {selectedLeadIndex + 1} / {extractedLeads.length}
                </span>
                <button
                  onClick={() => setSelectedLeadIndex(prev => Math.min(extractedLeads.length - 1, prev + 1))}
                  disabled={selectedLeadIndex === extractedLeads.length - 1}
                  className="px-2 py-1 text-xs bg-green-200 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {currentLead && (
            <div className="space-y-2 text-sm text-green-700">
              {currentLead.name && (
                <div className="flex items-center">
                  <User className="h-3 w-3 mr-2" />
                  <span className="font-medium">Name:</span> {currentLead.name}
                </div>
              )}
              {currentLead.company && (
                <div className="flex items-center">
                  <Building className="h-3 w-3 mr-2" />
                  <span className="font-medium">Company:</span> {currentLead.company}
                </div>
              )}
              {currentLead.title && (
                <div className="flex items-center">
                  <span className="font-medium">Title:</span> {currentLead.title}
                </div>
              )}
              {currentLead.email && (
                <div className="flex items-center">
                  <Mail className="h-3 w-3 mr-2" />
                  <span className="font-medium">Email:</span> {currentLead.email}
                </div>
              )}
              {currentLead.phone && (
                <div className="flex items-center">
                  <Phone className="h-3 w-3 mr-2" />
                  <span className="font-medium">Phone:</span> {currentLead.phone}
                </div>
              )}
              {currentLead.website && (
                <div className="flex items-center">
                  <Globe className="h-3 w-3 mr-2" />
                  <span className="font-medium">Website:</span> {currentLead.website}
                </div>
              )}
              {currentLead.address && (
                <div className="flex items-center">
                  <span className="font-medium">Address:</span> {currentLead.address}
                </div>
              )}
              {currentLead.industry && (
                <div className="flex items-center">
                  <span className="font-medium">Industry:</span> {currentLead.industry}
                </div>
              )}
              {currentLead.social_media && Object.keys(currentLead.social_media).length > 0 && (
                <div className="flex items-center">
                  <span className="font-medium">Social Media:</span> 
                  {Object.entries(currentLead.social_media).map(([platform, handle]) => (
                    <span key={platform} className="ml-2 bg-green-100 px-1 rounded">
                      {platform}: {handle}
                    </span>
                  ))}
                </div>
              )}
              <div className="pt-2 text-xs text-green-600">
                ✓ Form has been automatically prefilled with this data
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-center space-y-2">
        <div className="flex justify-center items-center space-x-4">
          <div className={`flex items-center ${faceDetected ? 'text-green-600' : 'text-red-600'}`}>
            {faceDetected ? <Check className="mr-1" /> : <X className="mr-1" />}
            Face Detected
          </div>
          <div className={`flex items-center ${liveDetected ? 'text-green-600' : 'text-yellow-600'}`}>
            {liveDetected ? <Check className="mr-1" /> : <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            Liveness
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={handleVerify}
          disabled={!documentFile || !liveDetected || loading || extractingData}
          className={`px-6 py-3 rounded-md font-semibold flex justify-center mx-auto items-center transition-all ${
            liveDetected && documentFile && !extractingData
              ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2" /> Verifying...
            </>
          ) : (
            "Verify Identity & Continue"
          )}
        </button>
      </div>

      {statusMsg && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-blue-700 font-medium text-center">
            {statusMsg}
          </div>
        </div>
      )}

      {verificationAttempted && !loading && (
        <div className="mt-4 text-center">
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Restart Verification
          </button>
        </div>
      )}
    </div>
  );
};