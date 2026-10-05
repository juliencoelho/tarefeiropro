import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { Camera, Upload, X, Check, RotateCcw } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

interface AvatarUploadProps {
  currentAvatar?: string;
  onAvatarChange: (avatarUrl: string) => void;
  size?: number;
}

export function AvatarUpload({ currentAvatar, onAvatarChange, size = 120 }: AvatarUploadProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isLoading, setIsLoading] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Função para centralizar o crop quando a imagem carrega
  function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
    return centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect,
        mediaWidth,
        mediaHeight,
      ),
      mediaWidth,
      mediaHeight,
    );
  }

  // Quando a imagem é carregada, define o crop inicial
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerAspectCrop(width, height, 1); // Aspect ratio 1:1 para avatar circular
    setCrop(crop);
  }, []);

  // Manipula a seleção de arquivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validações
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setIsModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Gera o canvas com a imagem recortada
  const generateCroppedImage = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Define o tamanho do canvas para o avatar final
    const avatarSize = 200; // Tamanho final do avatar
    canvas.width = avatarSize;
    canvas.height = avatarSize;

    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      avatarSize,
      avatarSize,
    );

    return new Promise<string>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve(url);
        }
      }, 'image/jpeg', 0.9);
    });
  }, [completedCrop]);

  // Salva o avatar recortado
  const handleSaveAvatar = async () => {
    setIsLoading(true);
    try {
      const croppedImageUrl = await generateCroppedImage();
      if (croppedImageUrl) {
        onAvatarChange(croppedImageUrl);
        setIsModalOpen(false);
        setImageSrc('');
      }
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      alert('Erro ao processar a imagem. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancela o upload
  const handleCancel = () => {
    setIsModalOpen(false);
    setImageSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  // Remove o avatar atual
  const handleRemoveAvatar = () => {
    onAvatarChange('');
  };

  return (
    <>
      {/* Avatar Display */}
      <div className="flex items-center gap-4">
        <div 
          className="relative group cursor-pointer"
          style={{ width: size, height: size }}
        >
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt="Avatar"
              className="w-full h-full rounded-full object-cover border-2 border-slate-200 dark:border-slate-600"
            />
          ) : (
            <div className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-semibold border-2 border-slate-200 dark:border-slate-600">
              <Camera className="w-8 h-8" />
            </div>
          )}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
          
          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 w-full h-full rounded-full opacity-0"
            aria-label="Alterar avatar"
          />
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            {currentAvatar ? 'Alterar Foto' : 'Adicionar Foto'}
          </button>
          
          {currentAvatar && (
            <button
              onClick={handleRemoveAvatar}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Remover Foto
            </button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Modal de Recorte */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Ajustar Foto do Avatar
                </h3>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Arraste para reposicionar e redimensione a área selecionada para escolher a parte da foto que será usada como avatar.
                </p>

                {imageSrc && (
                  <div className="flex justify-center">
                    <ReactCrop
                      crop={crop}
                      onChange={(_, percentCrop) => setCrop(percentCrop)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={1}
                      circularCrop
                      className="max-w-full"
                    >
                      <img
                        ref={imgRef}
                        alt="Crop preview"
                        src={imageSrc}
                        onLoad={onImageLoad}
                        className="max-w-full max-h-96 object-contain"
                      />
                    </ReactCrop>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-600">
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Cancelar
                  </button>
                  
                  <button
                    onClick={handleSaveAvatar}
                    disabled={isLoading || !completedCrop}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-400 text-white rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {isLoading ? 'Processando...' : 'Salvar Avatar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Canvas oculto para gerar a imagem final */}
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
}