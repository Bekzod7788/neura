import os, torch, glob, shutil, tempfile, numpy as np, json, uuid, traceback, nibabel as nib
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# CPU yadrolarini to'liq ishlatish
torch.set_num_threads(os.cpu_count() or 4)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

try:
    from nnunetv2.inference.predict_from_raw_data import nnUNetPredictor
    HAS_NNUNET = True
except Exception as e:
    HAS_NNUNET = False
    print(f"nnunetv2 yuklanmadi: {e}")

ai_models = {}

CLASS_NAMES = {
    "alzheimer_2d": ["Mild Dementia", "Moderate Dementia", "No Dementia", "Very Mild Dementia"],
    "alzheimer_3d": ["Alzheimer's Disease", "Mild Cognitive Impairment", "Cognitively Normal"],
    "ich_3d": [
        "Fon (sog'lom to'qima)",
        "Intraparenximal qon quyilishi (IPH)",
        "Intraventrikulyar qon quyilishi (IVH)",
        "Subaraxnoidal qon quyilishi (SAH)",
        "Subdural gematoma (SDH)",
        "Epidural gematoma (EDH)"
    ]
}

def load_models():
    device = torch.device('cpu')

    if HAS_NNUNET:
        nnunet_configs = {
            "ich_3d": {"dir": "models/ich_3d"},
            "brain_tumor_3d": {"dir": "models/brain_tumor_3d"}
        }
        for name, cfg in nnunet_configs.items():
            dir_path = cfg["dir"]
            print(f"[*] {name} tekshirilmoqda")
            if not os.path.isdir(dir_path):
                continue

            plans_path = os.path.join(dir_path, "plans.json")
            if not os.path.exists(plans_path):
                alt = os.path.join(dir_path, "nnUNetPlans.json")
                if os.path.exists(alt):
                    shutil.copy(alt, plans_path)
            if not os.path.exists(plans_path):
                continue

            try:
                with open(plans_path, 'r') as f:
                    plans_data = json.load(f)
                plans_data.pop('trainer', None)
                plans_data.pop('trainer_name', None)
                with open(plans_path, 'w') as f:
                    json.dump(plans_data, f)
            except Exception:
                pass

            dataset_json = os.path.join(dir_path, "dataset.json")
            if not os.path.exists(dataset_json):
                default_dataset = {
                    "channel_names": {"0": "CT" if "ich" in name else "MRI"},
                    "labels": {"background": 0, "positive": 1},
                    "numTraining": 1,
                    "file_ending": ".nii.gz"
                }
                with open(dataset_json, 'w') as f:
                    json.dump(default_dataset, f)

            # FAQAT FOLD_0 – tezlik uchun
            checkpoint = os.path.join(dir_path, "fold_0", "checkpoint_final.pth")
            if not os.path.exists(checkpoint):
                print(f"[-] {name} fold_0 checkpoint topilmadi")
                continue

            try:
                predictor = nnUNetPredictor(device=device)
                predictor.initialize_from_trained_model_folder(
                    dir_path,
                    use_folds=(0,),          # faqat bitta fold
                    checkpoint_name='checkpoint_final.pth'
                )
                ai_models[name] = predictor
                print(f"[+] nnU-Net yuklandi: {name} (fold 0)")
            except Exception as e:
                print(f"[-] {name} yuklashda xatolik: {e}")
                traceback.print_exc()

    # Alzheimer 3D
    if os.path.exists("models/alzheimer_3d.pth"):
        try:
            import monai
            model_3d = monai.networks.nets.DenseNet121(spatial_dims=3, in_channels=1, out_channels=3)
            state = torch.load("models/alzheimer_3d.pth", map_location='cpu', weights_only=True)
            model_3d.load_state_dict(state, strict=True)
            model_3d.eval()
            ai_models["alzheimer_3d"] = {"type": "pth", "model": model_3d}
            print("[+] Alzheimer 3D yuklandi")
        except Exception as e:
            print(f"[-] Alzheimer 3D: {e}")

    # Alzheimer 2D
    if os.path.exists("models/alzheimer_2d.pth"):
        try:
            from torchvision import models
            model_2d = models.efficientnet_v2_s(weights=None)
            in_features = model_2d.classifier[1].in_features
            model_2d.classifier = torch.nn.Sequential(
                torch.nn.Dropout(p=0.4),
                torch.nn.Linear(in_features, 512),
                torch.nn.GELU(),
                torch.nn.Dropout(p=0.3),
                torch.nn.Linear(512, 256),
                torch.nn.GELU(),
                torch.nn.Dropout(p=0.2),
                torch.nn.Linear(256, 4)
            )
            state = torch.load("models/alzheimer_2d.pth", map_location='cpu', weights_only=True)
            model_2d.load_state_dict(state, strict=True)
            model_2d.eval()
            ai_models["alzheimer_2d"] = {"type": "pth", "model": model_2d}
            print("[+] Alzheimer 2D yuklandi")
        except Exception as e:
            print(f"[-] Alzheimer 2D: {e}")

load_models()

def preprocess_2d(file_path, size=(224,224)):
    import pydicom
    from PIL import Image
    from torchvision import transforms as T
    try:
        ds = pydicom.dcmread(file_path, force=True)
        img = ds.pixel_array.astype(np.float32)
        img = (img - img.min()) / (img.max() - img.min() + 1e-8)
        if img.ndim == 2:
            img = np.stack([img]*3, axis=-1)
    except:
        img = Image.open(file_path).convert('RGB')
        img = np.array(img).astype(np.float32) / 255.0
    img = torch.from_numpy(img).permute(2,0,1).unsqueeze(0)
    img = torch.nn.functional.interpolate(img, size=size, mode='bilinear')
    norm = T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    img = norm(img.squeeze(0)).unsqueeze(0)
    return img

def preprocess_nifti_3d(file_path, size=(128,128,128)):
    img = nib.load(file_path).get_fdata().astype(np.float32)
    img = (img - img.min()) / (img.max() - img.min() + 1e-8)
    img = torch.from_numpy(img).unsqueeze(0).unsqueeze(0)
    img = torch.nn.functional.interpolate(img, size=size, mode='trilinear')
    return img

def analyze_ich_mask(mask_array):
    unique_labels = np.unique(mask_array).astype(int).tolist()
    return [CLASS_NAMES["ich_3d"][lbl] for lbl in unique_labels if lbl != 0 and lbl < len(CLASS_NAMES["ich_3d"])]

@app.post("/predict/{model_name}")
async def predict(model_name: str, file: UploadFile = File(...)):
    if model_name not in ai_models:
        return JSONResponse({"error": f"Model topilmadi"}, status_code=404)

    if "3d" in model_name:
        if not file.filename.lower().endswith(('.nii', '.nii.gz')):
            return JSONResponse({"error": "Faqat .nii/.nii.gz yuklang"}, status_code=400)

    suffix = '.nii.gz' if file.filename.lower().endswith('.gz') else '.nii'
    temp_in = tempfile.NamedTemporaryFile(delete=False, suffix=suffix).name
    with open(temp_in, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_id = uuid.uuid4().hex
    original_saved = os.path.join("static", f"{file_id}_input{suffix}")
    shutil.copy(temp_in, original_saved)
    file_url = f"http://localhost:8000/static/{file_id}_input{suffix}"

    try:
        model_info = ai_models[model_name]
        if isinstance(model_info, nnUNetPredictor):
            # Kanal soniga qarab fayl nusxalash (kerak bo'lsa)
            channel_names = model_info.dataset_json.get('channel_names', {'0':'MRI'})
            num_channels = len(channel_names)
            temp_files = []
            if num_channels == 1:
                temp_files.append(temp_in)
            else:
                for c in range(num_channels):
                    cfile = tempfile.NamedTemporaryFile(delete=False, suffix=suffix).name
                    shutil.copy(temp_in, cfile)
                    temp_files.append(cfile)

            # Asosiy bashorat (faqat fold_0 bilan tez)
            result_mask = model_info.predict_from_files([temp_files], None)
            mask_np = result_mask[0].astype(np.uint8)

            # Vaqtinchalik fayllarni tozalash
            for tf in temp_files:
                if tf != temp_in and os.path.exists(tf):
                    os.remove(tf)

            mask_saved = os.path.join("static", f"{file_id}_mask.nii.gz")
            nib.save(nib.Nifti1Image(mask_np, np.eye(4)), mask_saved)
            mask_url = f"http://localhost:8000/static/{file_id}_mask.nii.gz"

            result = {"mask_shape": mask_np.shape, "file_url": file_url, "mask_url": mask_url}
            if model_name == "ich_3d":
                findings = analyze_ich_mask(mask_np)
                result["findings"] = findings
                result["summary"] = f"Qon quyilishi aniqlandi: {', '.join(findings)}" if findings else "Qon quyilishi yo'q"
            else:
                result["mask_values"] = np.unique(mask_np).astype(int).tolist()
            return result
        else:
            model = model_info["model"]
            is_2d = "2d" in model_name
            tensor = preprocess_2d(temp_in) if is_2d else preprocess_nifti_3d(temp_in)
            with torch.no_grad():
                output = model(tensor)
                if output.dim() == 2 or output.shape[1] > 1:
                    prob = torch.softmax(output, dim=1).squeeze().tolist()
                    pred_class = output.argmax(dim=1).item()
                    if model_name in CLASS_NAMES:
                        class_name = CLASS_NAMES[model_name][pred_class]
                        all_class_names = CLASS_NAMES[model_name]
                    else:
                        class_name = None
                        all_class_names = [f"Class {i}" for i in range(len(prob))]
                    return {"class_id": pred_class, "class_name": class_name, "probabilities": prob, "class_names": all_class_names}
                else:
                    mask = (output.squeeze() > 0.5).cpu().numpy().astype(int).tolist()
                    return {"mask_shape": output.shape, "mask": mask}
    except Exception as e:
        traceback.print_exc()
        return JSONResponse({"error": f"Tahlil xatosi: {str(e)}"}, status_code=500)
    finally:
        if os.path.exists(temp_in):
            os.remove(temp_in)

@app.get("/health")
def health():
    return {"status": "ok", "models": list(ai_models.keys())}