import cv2
import numpy as np
import requests
import sys
import json

def download_image(url):
    response = requests.get(url)
    image = cv2.imdecode(np.frombuffer(response.content, np.uint8), -1)
    return cv2.cvtColor(image, cv2.COLOR_BGR2HSV)



def compare_images(hsv_image1, hsv_image2):
    # Calculate the histograms
    hist_image1 = cv2.calcHist([hsv_image1], [0, 1], None, [180, 256], [0, 180, 0, 256])
    hist_image2 = cv2.calcHist([hsv_image2], [0, 1], None, [180, 256], [0, 180, 0, 256])

    # Normalize the histograms
    cv2.normalize(hist_image1, hist_image1, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
    cv2.normalize(hist_image2, hist_image2, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)

    # Compare the histograms
    similarity = cv2.compareHist(hist_image1, hist_image2, cv2.HISTCMP_CORREL)
    return similarity

def process_images(url_array, prechosen_image):
    if not url_array:
        print("No URLs to process.")
        return

    for url in url_array:
        hsv_image = download_image(url)
        similarity = compare_images(hsv_image, prechosen_image)
        print(f"Similarity with {url}: {similarity}")

def main():
    url_array_string = sys.argv[1]
    url_array = json.loads(url_array_string)

    # Load and process the pre-chosen image
    prechosen_image_path = 'frontOfpredicitabley_irrational.jpg'  # Update this path
    prechosen_image = cv2.imread(prechosen_image_path)
    prechosen_image = cv2.cvtColor(prechosen_image, cv2.COLOR_BGR2HSV)

    process_images(url_array, prechosen_image)

if __name__ == "__main__":
    main()
