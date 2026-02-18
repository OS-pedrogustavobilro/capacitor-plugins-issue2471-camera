import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonImg, IonCard, IonCardContent, IonCardHeader, IonCardTitle, Platform } from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';
import { FileViewer } from '@capacitor/file-viewer';
import { CommonModule } from '@angular/common';

interface LocalFile {
  name: string;
  data: string;
  mimeType: string;
  imagePath: string;
  webPath?: string;
  nativePath?: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonImg, IonCard, IonCardContent, IonCardHeader, IonCardTitle, CommonModule],
})
export class HomePage {
  capturedImage: LocalFile | null = null;
  errorMessage: string = '';

  constructor(private platform: Platform) {}

  async takePicture() {
    try {
      this.errorMessage = '';
      this.capturedImage = null;

      const image = await Camera.getPhoto({
        quality: 30,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        saveToGallery: true,
      });

      console.log('Photo captured:', image);

      if (image) {
        const fileName = `${this.generateGUID()}.jpeg`;
        const base64Data = await this.readAsBase64(image);
        const imagePath = image.webPath || '';

        this.capturedImage = {
          name: fileName,
          data: base64Data,
          mimeType: `image/${image.format}`,
          imagePath,
          webPath: image.webPath,
          nativePath: image.path
        };

        console.log('Image processed:', this.capturedImage);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      this.errorMessage = `Error: ${error}`;
    }
  }

  async selectFromGallery() {
    try {
      this.errorMessage = '';
      this.capturedImage = null;

      const image = await Camera.getPhoto({
        quality: 30,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        saveToGallery: false,
      });

      console.log('Photo selected from gallery:', image);

      if (image) {
        const fileName = `${this.generateGUID()}.jpeg`;
        const base64Data = await this.readAsBase64(image);
        const imagePath = image.webPath || '';

        this.capturedImage = {
          name: fileName,
          data: base64Data,
          mimeType: `image/${image.format}`,
          imagePath,
          webPath: image.webPath,
          nativePath: image.path
        };

        console.log('Image processed:', this.capturedImage);
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      this.errorMessage = `Error: ${error}`;
    }
  }

  async openInNativeViewer() {
    if (!this.capturedImage?.nativePath) {
      this.errorMessage = 'No native path available for file viewer';
      return;
    }

    if (!this.platform.is('hybrid')) {
      this.errorMessage = 'File viewer only works on native apps';
      return;
    }

    try {
      console.log('Opening file in native viewer:', this.capturedImage.nativePath);
      console.log('MIME type:', this.capturedImage.mimeType);

      await FileViewer.openDocumentFromLocalPath({
        path: this.capturedImage.nativePath
      });

      console.log('File viewer opened successfully - Check if colors look correct in native viewer!');
    } catch (error) {
      console.error('Error opening file viewer:', error);
      this.errorMessage = `File viewer error: ${error}`;
    }
  }

  private async readAsBase64(photo: Photo): Promise<string> {
    if (this.platform.is('hybrid')) {
      // Running on mobile device
      console.log('Reading file from path:', photo.path);
      console.log('Photo format:', photo.format);
      console.log('Photo exif:', (photo as any).exif);

      const file = await Filesystem.readFile({
        path: photo.path!,
      });

      console.log('File data length:', typeof file.data === 'string' ? file.data.length : 'Not a string');
      console.log('File data type:', typeof file.data);

      const base64Data = `data:image/${photo.format};base64,${file.data}`;

      // Log first 100 chars of base64 to check format
      console.log('Base64 prefix:', base64Data.substring(0, 100));

      return base64Data;
    } else {
      // Running in browser
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();
      console.log('Blob type:', blob.type);
      console.log('Blob size:', blob.size);
      return await this.convertBlobToBase64(blob) as string;
    }
  }

  private convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
  }

  private generateGUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
