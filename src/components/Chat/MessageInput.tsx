import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  database,
  storage,
} from '../../firebase/config';
import {
  ref as databaseRef,
  push,
  update,
  serverTimestamp,
} from 'firebase/database';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessageInputProps {
  chatId: string;
}

const MessageInput: React.FC<
  MessageInputProps
> = ({ chatId }) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] =
    useState(false);
  const [imageFile, setImageFile] =
    useState<File | null>(null);
  const [imagePreview, setImagePreview] =
    useState<string | null>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef =
    React.useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Erro',
          description:
            'Por favor, selecione apenas imagens.',
          variant: 'destructive',
        });
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Erro',
          description:
            'A imagem deve ter menos de 5MB.',
          variant: 'destructive',
        });
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      (!message.trim() && !imageFile) ||
      !currentUser
    ) {
      return;
    }

    setIsLoading(true);
    try {
      // Create a messages reference
      const messagesRef = databaseRef(
        database,
        `messages/${chatId}`
      );
      const newMessageRef = push(messagesRef);
      const messageId = newMessageRef.key;

      let imageUrl = '';

      // Upload image if present
      if (imageFile) {
        const imageStorageRef = storageRef(
          storage,
          `chat_images/${chatId}/${messageId}`
        );
        await uploadBytes(
          imageStorageRef,
          imageFile
        );
        imageUrl = await getDownloadURL(
          imageStorageRef
        );
      }

      // Create message object
      const messageData = {
        id: messageId,
        text: message.trim(),
        senderId: currentUser.uid,
        senderName:
          currentUser.displayName || 'Usuário',
        timestamp: Date.now(),
        ...(imageUrl && { imageUrl }),
      };

      // Save message to database
      await update(newMessageRef, messageData);

      // Update chat's last message
      const chatRef = databaseRef(
        database,
        `chats/${chatId}`
      );
      await update(chatRef, {
        lastMessage: {
          text: imageUrl
            ? message.trim() || 'Imagem enviada'
            : message.trim(),
          timestamp: Date.now(),
        },
      });

      // Reset form
      setMessage('');
      removeImage();
    } catch (error) {
      toast({
        title: 'Erro',
        description:
          'Não foi possível enviar a mensagem. Tente novamente.',
        variant: 'destructive',
      });
      console.error(
        'Error sending message: ',
        error
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border-t">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col space-y-2"
      >
        {imagePreview && (
          <div className="relative mb-2">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-40 rounded-md object-contain bg-muted/20"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-1 right-1 h-6 w-6 p-1"
              onClick={removeImage}
            >
              &times;
            </Button>
          </div>
        )}

        <div className="flex space-x-2">
          <Textarea
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            placeholder="Digite sua mensagem..."
            className="resize-none min-h-[60px]"
          />
        </div>

        <div className="flex justify-between">
          <div></div>

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />

          <Button
            type="submit"
            disabled={
              isLoading ||
              (!message.trim() && !imageFile)
            }
          >
            Enviar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
