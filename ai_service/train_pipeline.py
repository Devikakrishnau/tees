import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import json

from models.fusion_network import MultimodalFusionNetwork

# --- DUMMY DATASET FOR DEMONSTRATION ---
class FusionDataset(Dataset):
    def __init__(self, jsonl_path):
        # In a real scenario, this loads from the annotated JSONL file
        self.data = []
        # Generating 100 random dummy entries for pipeline verification
        for _ in range(100):
            # 15 features
            features = torch.rand(15) * 100 
            # 5 ground truth labels
            labels = torch.rand(5) * 100
            self.data.append((features, labels))
            
    def __len__(self):
        return len(self.data)
        
    def __getitem__(self, idx):
        return self.data[idx]

def train_fusion_model(epochs=10, batch_size=16, learning_rate=0.001):
    print("Initializing Multimodal Fusion Network Training...")
    
    # 1. Load Dataset
    train_dataset = FusionDataset("fusion_dataset.jsonl")
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    
    # 2. Initialize Model
    model = MultimodalFusionNetwork(input_dim=15)
    
    # 3. Loss & Optimizer (Weighted Multi-Task Loss could be implemented here)
    criterion = nn.MSELoss()
    optimizer = optim.AdamW(model.parameters(), lr=learning_rate)
    
    # 4. Training Loop
    model.train()
    for epoch in range(epochs):
        epoch_loss = 0.0
        for features, labels in train_loader:
            optimizer.zero_grad()
            
            # Forward pass
            outputs = model(features)
            
            # Extract the 5 prediction heads into a tensor
            preds = torch.stack([
                outputs["communication_score"].squeeze(),
                outputs["confidence_score"].squeeze(),
                outputs["engagement_score"].squeeze(),
                outputs["teaching_effectiveness_score"].squeeze(),
                outputs["overall_teacher_score"].squeeze()
            ], dim=1)
            
            # Calculate Loss (MSE)
            loss = criterion(preds, labels)
            
            # Backpropagation
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item()
            
        print(f"Epoch [{epoch+1}/{epochs}] - Avg Loss (MSE): {epoch_loss/len(train_loader):.4f}")
        
    # 5. Save Model
    print("Training Complete. Saving model weights...")
    torch.save(model.state_dict(), "best_fusion_model.pt")
    print("Saved to best_fusion_model.pt")

if __name__ == "__main__":
    train_fusion_model()
