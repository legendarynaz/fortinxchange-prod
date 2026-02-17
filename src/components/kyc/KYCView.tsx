
import React, { useState, useRef, useEffect } from 'react';
import Button from '../ui/Button';
import DocumentIcon from '../icons/DocumentIcon';
import CameraIcon from '../icons/CameraIcon';
import UploadIcon from '../icons/UploadIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import LogoIcon from '../icons/LogoIcon';
import { simulateSendEmail } from '../../emails/templates';

type KYCStep = 'start' | 'document_select' | 'document_upload' | 'facial_scan' | 'submitting' | 'review' | 'success';
type DocumentType = 'passport' | 'drivers_license' | 'id_card';

interface KYCViewProps {
  onVerificationComplete: () => void;
}

const KYCView: React.FC<KYCViewProps> = ({ onVerificationComplete }) => {
  const [step, setStep] = useState<KYCStep>('start');
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOn(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions and try again.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  const handleDocumentSelect = (type: DocumentType) => {
    setDocumentType(type);
    setStep('document_upload');
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setDocumentFile(event.target.files[0]);
    }
  };
  
  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      stopCamera();
      // In a real app, you would convert canvas.toDataURL() to a blob and upload.
      setStep('submitting');
    }
  };
  
  useEffect(() => {
    if (step === 'facial_scan' && !isCameraOn) {
      startCamera();
    }
    if (step !== 'facial_scan' && isCameraOn) {
        stopCamera();
    }
    
    if (step === 'submitting') {
        simulateSendEmail('kycSubmitted', {});
        // Simulate backend processing
        setTimeout(() => setStep('review'), 2000);
    }
    
    return () => stopCamera();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  
  const StepContainer: React.FC<{title: string, subtitle: string, children: React.ReactNode}> = ({title, subtitle, children}) => (
      <div className="w-full max-w-lg mx-auto bg-white border border-slate-200 rounded-xl shadow-lg p-6 sm:p-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{title}</h2>
          <p className="text-slate-500 mt-2 mb-8">{subtitle}</p>
          {children}
      </div>
  );

  const renderContent = () => {
    switch (step) {
        case 'start':
            return (
                <StepContainer title="Verify Your Identity" subtitle="To comply with regulations and secure your account, we need to verify your identity.">
                    <Button onClick={() => setStep('document_select')} className="w-full">Start Verification</Button>
                </StepContainer>
            );
        case 'document_select':
             return (
                <StepContainer title="Select Your ID Document" subtitle="Please choose one of the following government-issued documents.">
                    <div className="space-y-3">
                        <DocumentButton onClick={() => handleDocumentSelect('passport')} label="Passport" />
                        <DocumentButton onClick={() => handleDocumentSelect('drivers_license')} label="Driver's License" />
                        <DocumentButton onClick={() => handleDocumentSelect('id_card')} label="National ID Card" />
                    </div>
                </StepContainer>
             );
        case 'document_upload':
            return (
                <StepContainer title={`Upload Your ${documentType?.replace('_', ' ')}`} subtitle="Please upload a clear, high-quality image of your document.">
                    <div className="w-full h-40 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center mb-4">
                        {documentFile ? (
                           <p className="text-slate-700 font-medium">{documentFile.name}</p>
                        ) : (
                           <UploadIcon className="w-10 h-10 text-slate-400 mb-2" />
                        )}
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-sky-600 hover:text-sky-500 focus-within:outline-none">
                            <span>{documentFile ? 'Change file' : 'Upload a file'}</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg" />
                        </label>
                    </div>
                    <Button onClick={() => setStep('facial_scan')} disabled={!documentFile} className="w-full">Continue</Button>
                </StepContainer>
            );
        case 'facial_scan':
             return (
                <StepContainer title="Facial Verification" subtitle="Please position your face in the center of the frame.">
                    <div className="w-full aspect-square bg-slate-900 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                        <video ref={videoRef} autoPlay playsInline muted className={`transform scale-x-[-1] ${!isCameraOn && 'hidden'}`}></video>
                        <canvas ref={canvasRef} className="hidden"></canvas>
                        {!isCameraOn && <div className="w-12 h-12 border-4 border-slate-200 border-t-sky-500 rounded-full animate-spin"></div>}
                    </div>
                    <Button onClick={handleCapture} disabled={!isCameraOn} className="w-full flex items-center justify-center">
                        <CameraIcon className="w-5 h-5 mr-2" /> Capture
                    </Button>
                </StepContainer>
            );
        case 'submitting':
            return (
                <StepContainer title="Submitting Your Information" subtitle="Please wait while we securely submit your verification data.">
                    <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </StepContainer>
            );
        case 'review':
             return (
                <StepContainer title="Verification Under Review" subtitle="Your documents have been submitted and are now under review. This usually takes a few minutes. We will notify you by email once the process is complete.">
                     <p className="text-slate-600 mb-6">You can now close this window.</p>
                     {/* In a real app, you would likely just let them close it. This button simulates approval. */}
                     <Button onClick={() => {
                         simulateSendEmail('kycApproved', {});
                         setStep('success');
                     }} className="w-full">Simulate Approval</Button>
                </StepContainer>
            );
        case 'success':
            return (
                 <StepContainer title="Verification Successful!" subtitle="Your identity has been verified. You now have full access to all features on FortinXchange.">
                    <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-6" />
                    <Button onClick={onVerificationComplete} className="w-full">Go to Dashboard</Button>
                </StepContainer>
            );
    }
  };
  
  const DocumentButton: React.FC<{onClick:()=>void, label:string}> = ({onClick, label}) => (
      <button onClick={onClick} className="w-full flex items-center text-left p-4 border border-slate-200 rounded-lg hover:bg-sky-50 hover:border-sky-400 transition-all">
          <DocumentIcon className="w-6 h-6 mr-4 text-sky-600" />
          <span className="font-semibold text-slate-700">{label}</span>
      </button>
  );

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4">
        <div className="absolute top-6 flex items-center gap-3">
             <LogoIcon />
             <h1 className="text-2xl font-bold text-slate-900 tracking-tighter">FortinXchange</h1>
        </div>
      {renderContent()}
    </div>
  );
};

export default KYCView;
