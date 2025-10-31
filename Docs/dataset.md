# Facial Emotion Dataset Information

## Dataset Name: FER-2013
- **Source / URL:** [FER-2013 on Kaggle](https://www.kaggle.com/datasets/msambare/fer2013)
- **License:** Public dataset for research and educational purposes 
- **Description:**  
  - Contains **35,887 grayscale facial images** of size 48x48 pixels.  
  - Each image is labeled with **one of 7 emotions**:  
    `Angry, Disgust, Fear, Happy, Sad, Surprise, Neutral`.  
  - Designed for **facial emotion recognition research**.  
- **Structure:**  
  - CSV file with columns: `emotion, pixels, usage`.  
    - `emotion`: numeric label (0-6) corresponding to the emotion.  
    - `pixels`: space-separated pixel values (grayscale).  
    - `usage`: specifies dataset split (`Training`, `PublicTest`, `PrivateTest`).  
- **Notes:**  
  - Preprocessing needed: reshape pixel values into 48x48 arrays.  
  - Images are already centered on the face, so no complex cropping required.  
  - Training/validation/test splits are provided in the dataset.  
