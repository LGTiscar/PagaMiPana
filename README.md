# QuickSplit

A mobile app for splitting restaurant bills with friends. Take a photo of your receipt, assign items to people, and calculate who owes what.

## Features

- OCR receipt scanning using Google's Gemini API
- Manual item entry
- Assign items to specific people
- Calculate individual totals
- Share results via native share functionality
- Export as text or PDF

## Setup Instructions

### Prerequisites

- Node.js 16+
- npm or yarn
- Xcode (for iOS builds)
- Android Studio (for Android builds)

### Installation

1. Clone the repository
2. Install dependencies:
3. Add your Google API key for OCR functionality:
   - Create a `.env.local` file in the root directory
   - Add your Gemini API key: `NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key_here`
   - This key is required for the OCR functionality to work

