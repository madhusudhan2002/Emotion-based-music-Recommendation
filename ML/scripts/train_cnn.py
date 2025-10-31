# Facial Expression CNN Training (RAF-DB)
import os
import numpy as np
from PIL import Image
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns


# SETTINGS
RAW_DATASET_PATH = r"D:\Infosys\ML\data\raw\dataset"
PROCESSED_PATH   = r"D:\Infosys\ML\data\processed"
IMG_SIZE   = 48
VAL_RATIO  = 0.15
BATCH_SIZE = 64
EPOCHS     = 50

class_map = {
    "1": "suprise",
    "2": "fear",
    "3": "disgust",
    "4": "happy",
    "5": "sad",
    "6": "anger",
    "7": "neutral"
}


# IMAGE PREPROCESSING
def preprocess_image(img_path):
    img = Image.open(img_path).convert('L')        
    img = img.resize((IMG_SIZE, IMG_SIZE))
    img_array = np.array(img)/255.0
    return Image.fromarray((img_array*255).astype(np.uint8))

train_datagen = ImageDataGenerator(
    rotation_range=15,
    width_shift_range=0.1,
    height_shift_range=0.1,
    zoom_range=0.1,
    horizontal_flip=True
)


# DATASET PROCESSING
def process_dataset(src_folder, dest_folder, is_train=True):
    for class_folder in os.listdir(src_folder):
        class_path = os.path.join(src_folder, class_folder)
        if not os.path.isdir(class_path):
            continue
        images = os.listdir(class_path)
        emotion_name = class_map[class_folder]

        if is_train:
            train_imgs, val_imgs = train_test_split(images, test_size=VAL_RATIO, random_state=42)

            # Training set
            for img_name in train_imgs:
                os.makedirs(os.path.join(dest_folder, "train", emotion_name), exist_ok=True)
                img = preprocess_image(os.path.join(class_path, img_name))
                img.save(os.path.join(dest_folder, "train", emotion_name, img_name))

                # Augmentation
                img_array = np.array(img)/255.0
                img_array = img_array.reshape((1, IMG_SIZE, IMG_SIZE, 1))
                for _ in train_datagen.flow(img_array, batch_size=1,
                                            save_to_dir=os.path.join(dest_folder, "train", emotion_name),
                                            save_prefix='aug', save_format='png'):
                    break

            # Validation set
            for img_name in val_imgs:
                os.makedirs(os.path.join(dest_folder, "val", emotion_name), exist_ok=True)
                img = preprocess_image(os.path.join(class_path, img_name))
                img.save(os.path.join(dest_folder, "val", emotion_name, img_name))
        else:
            # Test set
            for img_name in images:
                os.makedirs(os.path.join(dest_folder, "test", emotion_name), exist_ok=True)
                img = preprocess_image(os.path.join(class_path, img_name))
                img.save(os.path.join(dest_folder, "test", emotion_name, img_name))



# PROCESS RAW DATA
process_dataset(os.path.join(RAW_DATASET_PATH, "train"), PROCESSED_PATH, is_train=True)
process_dataset(os.path.join(RAW_DATASET_PATH, "test"), PROCESSED_PATH, is_train=False)

train_dir = os.path.join(PROCESSED_PATH, "train")
val_dir   = os.path.join(PROCESSED_PATH, "val")
test_dir  = os.path.join(PROCESSED_PATH, "test")

train_gen = ImageDataGenerator(rescale=1./255).flow_from_directory(
    train_dir, target_size=(IMG_SIZE, IMG_SIZE),
    color_mode="grayscale", class_mode="categorical",
    batch_size=BATCH_SIZE
)

val_gen = ImageDataGenerator(rescale=1./255).flow_from_directory(
    val_dir, target_size=(IMG_SIZE, IMG_SIZE),
    color_mode="grayscale", class_mode="categorical",
    batch_size=BATCH_SIZE
)

test_gen = ImageDataGenerator(rescale=1./255).flow_from_directory(
    test_dir, target_size=(IMG_SIZE, IMG_SIZE),
    color_mode="grayscale", class_mode="categorical",
    batch_size=BATCH_SIZE, shuffle=False
)


# CLASS WEIGHTS
class_weights = compute_class_weight(
    class_weight="balanced",
    classes=np.unique(train_gen.classes),
    y=train_gen.classes
)
class_weights = dict(enumerate(class_weights))


# CNN MODEL
model = Sequential([
    Conv2D(64, (3,3), activation="relu", input_shape=(IMG_SIZE, IMG_SIZE, 1)),
    BatchNormalization(), MaxPooling2D(2,2), Dropout(0.1),

    Conv2D(128, (3,3), activation="relu"),
    BatchNormalization(), MaxPooling2D(2,2), Dropout(0.1),

    Conv2D(256, (3,3), activation="relu"),
    BatchNormalization(), MaxPooling2D(2,2), Dropout(0.2),

    Flatten(),
    Dense(256, activation="relu"), BatchNormalization(), Dropout(0.3),
    Dense(train_gen.num_classes, activation="softmax")
])

model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])


# CALLBACKS
checkpoint = ModelCheckpoint("rafdb_cnn_model.h5", monitor="val_accuracy", save_best_only=True)
early_stop = EarlyStopping(monitor="val_loss", patience=8, restore_best_weights=True)


# TRAINING
history = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCHS,
    class_weight=class_weights,
    callbacks=[checkpoint, early_stop],
    steps_per_epoch=200,      
    validation_steps=50

)

model.save("rafdb_cnn_model.h5")
print(" CNN Training Completed and Model Saved")


# EVALUATION
loss, acc = model.evaluate(test_gen)
print(f"\n Overall Test Accuracy: {acc*100:.2f}%")

# Predictions
preds = model.predict(test_gen)
y_pred = np.argmax(preds, axis=1)

# Confusion Matrix
cm = confusion_matrix(test_gen.classes, y_pred)
class_names = list(train_gen.class_indices.keys())

# Per-class accuracy
per_class_acc = cm.diagonal() / cm.sum(axis=1)
print("\n Per-Emotion Accuracy:")
for idx, emotion in enumerate(class_names):
    print(f"{emotion}: {per_class_acc[idx]*100:.2f}%")

# Classification Report
print("\n Classification Report:\n")
print(classification_report(test_gen.classes, y_pred, target_names=class_names))

# Confusion Matrix Plot
plt.figure(figsize=(8,6))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=class_names,
            yticklabels=class_names)
plt.xlabel("Predicted")
plt.ylabel("True")
plt.title("Confusion Matrix")
plt.tight_layout()
plt.show()
