"""
Convert patients_data_with_alerts.xlsx to CSV for ML pipeline.
Run once before training: python scripts/convert_dataset.py
"""
import pandas as pd
import os

def convert():
    src = os.path.join(os.path.dirname(__file__), '../ml-service/data/patients_data_with_alerts.xlsx')
    dst = os.path.join(os.path.dirname(__file__), '../ml-service/data/patients_data_with_alerts.csv')
    df = pd.read_excel(src, sheet_name='Sheet1', engine='openpyxl')
    df.to_csv(dst, index=False)
    print(f"Converted {len(df)} records to {dst}")
    print("Columns:", df.columns.tolist())
    print(df.head(3))

if __name__ == '__main__':
    convert()
