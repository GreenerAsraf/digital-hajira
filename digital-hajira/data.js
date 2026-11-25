'use strict';

// ============================================================
//  SCHOOL INFORMATION
// ============================================================
const SCHOOL_DATA = {
  name_bn: 'ঘাগড়া খিলমোগল হাকিম উদ্দিন সরকারি প্রাথমিক বিদ্যালয়',
  name_en: 'Ghagra Khilmogol Hakim Uddin Govt. Primary School',
  district_bn: 'চট্টগ্রাম',
  district_en: 'Chittagong',
  adminPin: '9999',  // Master Admin PIN for Mohammed Asraf Uddin
  version: '2.3.0'
};

// ============================================================
//  TEACHERS & CLASS ASSIGNMENTS (Bikolpo 1)
//  - Each teacher has their own 4-digit PIN
//  - Class assignments:
//      0: প্রাক-প্রাথমিক (শিশু শ্রেণি) -> Shobhon Dey (PIN: 1001)
//      1: শ্রেণি ১ -> Priya Deb (PIN: 1010)
//      2: শ্রেণি ২ -> Salahuddin Mahmud (PIN: 1020)
//      3: শ্রেণি ৩ -> Nasima Akter (PIN: 1030)
//      4: শ্রেণি ৪ -> Mohammed Asraf Uddin (PIN: 1040) / Admin (PIN: 9999)
//      5: শ্রেণি ৫ -> Priyanka Barua (PIN: 1050)
// ============================================================
const TEACHERS = [
  { id: 1, name_bn: 'শোভন দে',                     name_en: 'Shobhon Dey',            role_bn: 'সহকারী শিক্ষক', role_en: 'Assistant Teacher', assignedClass: 0, pin: '1001', photo: null },
  { id: 2, name_bn: 'প্রিয়া দেব',                  name_en: 'Priya Deb',              role_bn: 'সহকারী শিক্ষক', role_en: 'Assistant Teacher', assignedClass: 1, pin: '1010', photo: null },
  { id: 3, name_bn: 'সালাহউদ্দিন মাহমুদ',         name_en: 'Salahuddin Mahmud',      role_bn: 'সহকারী শিক্ষক', role_en: 'Assistant Teacher', assignedClass: 2, pin: '1020', photo: null },
  { id: 4, name_bn: 'নাছিমা আকতার',                name_en: 'Nasima Akter',           role_bn: 'সহকারী শিক্ষক', role_en: 'Assistant Teacher', assignedClass: 3, pin: '1030', photo: null },
  { id: 5, name_bn: 'মোহাম্মদ আশরাফ উদ্দিন',      name_en: 'Mohammed Asraf Uddin',   role_bn: 'সহকারী শিক্ষক ও প্রধান অ্যাডমিন', role_en: 'Assistant Teacher & Admin', assignedClass: 4, isAdmin: true, pin: '1040', adminPin: '9999', photo: null },
  { id: 6, name_bn: 'প্রিয়াংকা বড়ুয়া',            name_en: 'Priyanka Barua',         role_bn: 'সহকারী শিক্ষক', role_en: 'Assistant Teacher', assignedClass: 5, pin: '1050', photo: null },
  { id: 7, name_bn: 'মুনমুন সাহা',                 name_en: 'Munmon Saha',            role_bn: 'ভারপ্রাপ্ত প্রধান শিক্ষক', role_en: 'Acting Head Teacher', assignedClass: -1, isActingHead: true, pin: '1234', photo: null }
];

// ============================================================
//  STUDENTS (0 = Pre-primary / শিশু শ্রেণি, 1 to 5 = Classes 1-5)
// ============================================================
const STUDENTS = {

  // ── প্রাক-প্রাথমিক / শিশু শ্রেণি (Pre-primary) ─────────────
  0: [
    { roll:  1, name_bn: 'মো. জিসান আহমেদ',            name_en: 'Md. Zisan Ahmed',           gender: 'M', repeater: false },
    { roll:  2, name_bn: 'মো. সামিউল ইসলাম',           name_en: 'Md. Samiul Islam',          gender: 'M', repeater: false },
    { roll:  3, name_bn: 'মো. আবরার ফাইয়াজ',          name_en: 'Md. Abrar Faiyaz',          gender: 'M', repeater: false },
    { roll:  4, name_bn: 'মো. রোহান হোসেন',             name_en: 'Md. Rohan Hossain',         gender: 'M', repeater: false },
    { roll:  5, name_bn: 'মো. সোয়াদ বিন হাসান',       name_en: 'Md. Sowad Bin Hasan',       gender: 'M', repeater: false },
    { roll:  6, name_bn: 'রুদ্র দেবনাথ',                name_en: 'Rudra Debnath',             gender: 'M', repeater: false },
    { roll:  7, name_bn: 'সায়ান সাহা',                  name_en: 'Sayan Saha',                gender: 'M', repeater: false },
    { roll:  8, name_bn: 'অর্পণ দাস',                   name_en: 'Arpan Das',                 gender: 'M', repeater: false },
    { roll:  9, name_bn: 'মোছা. জান্নাতুল মাওয়া',     name_en: 'Jannatul Mawa',             gender: 'F', repeater: false },
    { roll: 10, name_bn: 'মোছা. সাইফা নূর',             name_en: 'Saifa Noor',                gender: 'F', repeater: false },
    { roll: 11, name_bn: 'মোছা. আফিয়া ইবনাত',          name_en: 'Afia Ibnat',                gender: 'F', repeater: false },
    { roll: 12, name_bn: 'মোছা. তাসনিয়া তাবাসসুম',     name_en: 'Tasnia Tabassum',           gender: 'F', repeater: false },
    { roll: 13, name_bn: 'অনুষ্কা রানী দত্ত',           name_en: 'Anushka Rani Dutta',        gender: 'F', repeater: false },
    { roll: 14, name_bn: 'প্রীতি রানী দেব',             name_en: 'Priti Rani Deb',            gender: 'F', repeater: false },
    { roll: 15, name_bn: 'শ্রেয়া রানী দে',              name_en: 'Shreya Rani Dey',           gender: 'F', repeater: false },
    { roll: 16, name_bn: 'মো. নাঈম হাসান',              name_en: 'Md. Naim Hasan',            gender: 'M', repeater: false },
    { roll: 17, name_bn: 'মো. তাসফিক ইসলাম',           name_en: 'Md. Tasfik Islam',          gender: 'M', repeater: false },
    { roll: 18, name_bn: 'অনিল চন্দ্র সাহা',            name_en: 'Anil Chandra Saha',         gender: 'M', repeater: false },
    { roll: 19, name_bn: 'মোছা. হুমাইরা আক্তার',        name_en: 'Humaira Akter',             gender: 'F', repeater: false },
    { roll: 20, name_bn: 'মোছা. মারিয়া খাতুন',         name_en: 'Maria Khatun',              gender: 'F', repeater: false },
    { roll: 21, name_bn: 'মো. আলভী আহমেদ',              name_en: 'Md. Alvi Ahmed',            gender: 'M', repeater: false },
    { roll: 22, name_bn: 'মো. রাফসান হোসেন',            name_en: 'Md. Rafsan Hossain',        gender: 'M', repeater: false },
    { roll: 23, name_bn: 'মোছা. সামিয়া আক্তার',        name_en: 'Samia Akter',               gender: 'F', repeater: false },
    { roll: 24, name_bn: 'মোছা. ফাইজা ইসলাম',           name_en: 'Faiza Islam',               gender: 'F', repeater: false },
    { roll: 25, name_bn: 'কাব্য বড়ুয়া',                name_en: 'Kavya Barua',               gender: 'M', repeater: false },
    { roll: 26, name_bn: 'স্বস্তিকা দাস',               name_en: 'Swastika Das',              gender: 'F', repeater: false },
    { roll: 27, name_bn: 'মো. রিহান মাহমুদ',            name_en: 'Md. Rihan Mahmud',          gender: 'M', repeater: false },
    { roll: 28, name_bn: 'মোছা. মেহজাবিন তাসনিম',       name_en: 'Mehzabin Tasnim',           gender: 'F', repeater: false },
    { roll: 29, name_bn: 'অয়ন্তিকা বড়ুয়া',             name_en: 'Ayantika Barua',            gender: 'F', repeater: false },
    { roll: 30, name_bn: 'মো. রায়হান উদ্দিন',          name_en: 'Md. Rayhan Uddin',          gender: 'M', repeater: false }
  ],

  // ── শ্রেণি ১ (Class 1) ──────────────────────────────────
  1: [
    { roll:  1, name_bn: 'মো. আব্দুল্লাহ',            name_en: 'Md. Abdullah',              gender: 'M', repeater: false },
    { roll:  2, name_bn: 'মো. ইব্রাহিম',               name_en: 'Md. Ibrahim',               gender: 'M', repeater: false },
    { roll:  3, name_bn: 'মো. আরিফুল ইসলাম',           name_en: 'Md. Ariful Islam',          gender: 'M', repeater: true  },
    { roll:  4, name_bn: 'মো. নাইমুল ইসলাম',           name_en: 'Md. Naimul Islam',          gender: 'M', repeater: false },
    { roll:  5, name_bn: 'মো. তানভীর আহমেদ',           name_en: 'Md. Tanvir Ahmed',          gender: 'M', repeater: false },
    { roll:  6, name_bn: 'মো. রাকিব হাসান',             name_en: 'Md. Rakib Hasan',           gender: 'M', repeater: false },
    { roll:  7, name_bn: 'মো. ফাহিম আহমেদ',             name_en: 'Md. Fahim Ahmed',           gender: 'M', repeater: false },
    { roll:  8, name_bn: 'মো. মেহেদী হাসান',            name_en: 'Md. Mehedi Hasan',          gender: 'M', repeater: false },
    { roll:  9, name_bn: 'মো. ইমরান হোসেন',             name_en: 'Md. Imran Hossain',         gender: 'M', repeater: false },
    { roll: 10, name_bn: 'মো. নাফিস আহমেদ',             name_en: 'Md. Nafis Ahmed',           gender: 'M', repeater: false },
    { roll: 11, name_bn: 'সুমন কুমার দে',               name_en: 'Sumon Kumar Dey',           gender: 'M', repeater: false },
    { roll: 12, name_bn: 'পলাশ চন্দ্র সাহা',            name_en: 'Palash Chandra Saha',       gender: 'M', repeater: false },
    { roll: 13, name_bn: 'দীপ রঞ্জন দাস',               name_en: 'Deep Ranjan Das',           gender: 'M', repeater: false },
    { roll: 14, name_bn: 'তুহিন কান্তি রায়',            name_en: 'Tuhin Kanti Roy',           gender: 'M', repeater: false },
    { roll: 15, name_bn: 'রাজু দেবনাথ',                 name_en: 'Raju Debnath',              gender: 'M', repeater: false },
    { roll: 16, name_bn: 'মোছা. নাদিয়া আক্তার',        name_en: 'Nadia Akter',               gender: 'F', repeater: false },
    { roll: 17, name_bn: 'মোছা. সানজিদা আক্তার',        name_en: 'Sanjida Akter',             gender: 'F', repeater: false },
    { roll: 18, name_bn: 'মোছা. ফারিয়া তাসনিম',        name_en: 'Faria Tasnim',              gender: 'F', repeater: false },
    { roll: 19, name_bn: 'মোছা. সুমাইয়া খানম',          name_en: 'Sumaiya Khanam',            gender: 'F', repeater: false },
    { roll: 20, name_bn: 'মোছা. তানিয়া আক্তার',         name_en: 'Tania Akter',               gender: 'F', repeater: false },
    { roll: 21, name_bn: 'মোছা. আনিকা তাবাসসুম',        name_en: 'Anika Tabassum',            gender: 'F', repeater: false },
    { roll: 22, name_bn: 'মোছা. মেহের আফরোজ',           name_en: 'Meher Afroz',               gender: 'F', repeater: false },
    { roll: 23, name_bn: 'মোছা. রুবিনা আক্তার',          name_en: 'Rubina Akter',              gender: 'F', repeater: false },
    { roll: 24, name_bn: 'মোছা. শাকিলা আক্তার',          name_en: 'Shakila Akter',             gender: 'F', repeater: true  },
    { roll: 25, name_bn: 'পূজা রানী দাস',               name_en: 'Puja Rani Das',             gender: 'F', repeater: false },
    { roll: 26, name_bn: 'রিয়া দেবনাথ',                name_en: 'Riya Debnath',              gender: 'F', repeater: false },
    { roll: 27, name_bn: 'তিশা রানী সাহা',              name_en: 'Tisha Rani Saha',           gender: 'F', repeater: false },
    { roll: 28, name_bn: 'মিতা রানী বড়ুয়া',            name_en: 'Mita Rani Barua',           gender: 'F', repeater: false },
    { roll: 29, name_bn: 'দীপ্তি রানী দে',              name_en: 'Dipti Rani Dey',            gender: 'F', repeater: false },
    { roll: 30, name_bn: 'স্বর্ণা রানী চক্রবর্তী',      name_en: 'Swarna Rani Chakraborty',   gender: 'F', repeater: false }
  ],

  // ── শ্রেণি ২ (Class 2) ──────────────────────────────────
  2: [
    { roll:  1, name_bn: 'মো. ইউসুফ আলী',             name_en: 'Md. Yusuf Ali',             gender: 'M', repeater: false },
    { roll:  2, name_bn: 'মো. হাসান আলী',              name_en: 'Md. Hasan Ali',             gender: 'M', repeater: false },
    { roll:  3, name_bn: 'মো. সাকিব আল হাসান',         name_en: 'Md. Sakib Al Hasan',        gender: 'M', repeater: false },
    { roll:  4, name_bn: 'মো. আদনান হোসেন',            name_en: 'Md. Adnan Hossain',         gender: 'M', repeater: false },
    { roll:  5, name_bn: 'মো. তামিম ইকবাল',            name_en: 'Md. Tamim Iqbal',           gender: 'M', repeater: true  },
    { roll:  6, name_bn: 'মো. মিরাজুল ইসলাম',          name_en: 'Md. Mirajul Islam',         gender: 'M', repeater: false },
    { roll:  7, name_bn: 'মো. রিয়াজুল হক',             name_en: 'Md. Riazul Haq',            gender: 'M', repeater: false },
    { roll:  8, name_bn: 'মো. জাহিদুল ইসলাম',          name_en: 'Md. Zahidul Islam',         gender: 'M', repeater: false },
    { roll:  9, name_bn: 'মো. শাহিনুর রহমান',           name_en: 'Md. Shahinur Rahman',       gender: 'M', repeater: false },
    { roll: 10, name_bn: 'মো. আলম হোসেন',              name_en: 'Md. Alam Hossain',          gender: 'M', repeater: false },
    { roll: 11, name_bn: 'বিপ্লব কুমার নাথ',           name_en: 'Viplob Kumar Nath',         gender: 'M', repeater: false },
    { roll: 12, name_bn: 'সোহেল রানা',                 name_en: 'Sohel Rana',                gender: 'M', repeater: false },
    { roll: 13, name_bn: 'অভিজিৎ সরকার',               name_en: 'Avijit Sarkar',             gender: 'M', repeater: false },
    { roll: 14, name_bn: 'সৌরভ কুমার দত্ত',            name_en: 'Sourav Kumar Dutta',        gender: 'M', repeater: false },
    { roll: 15, name_bn: 'তন্ময় সাহা',                 name_en: 'Tanmoy Saha',               gender: 'M', repeater: false },
    { roll: 16, name_bn: 'মোছা. লামিয়া আক্তার',        name_en: 'Lamia Akter',               gender: 'F', repeater: false },
    { roll: 17, name_bn: 'মোছা. তাসনিম আক্তার',         name_en: 'Tasnim Akter',              gender: 'F', repeater: false },
    { roll: 18, name_bn: 'মোছা. সাদিয়া আক্তার',         name_en: 'Sadia Akter',               gender: 'F', repeater: false },
    { roll: 19, name_bn: 'মোছা. নুসরাত জাহান',          name_en: 'Nusrat Jahan',              gender: 'F', repeater: false },
    { roll: 20, name_bn: 'মোছা. ইশরাত জাহান',           name_en: 'Ishrat Jahan',              gender: 'F', repeater: false },
    { roll: 21, name_bn: 'মোছা. মাহিয়া মাহি',           name_en: 'Mahiya Mahi',               gender: 'F', repeater: false },
    { roll: 22, name_bn: 'মোছা. নাজমুন নাহার',          name_en: 'Nazmun Nahar',              gender: 'F', repeater: false },
    { roll: 23, name_bn: 'মোছা. রহিমা বেগম',            name_en: 'Rahima Begum',              gender: 'F', repeater: false },
    { roll: 24, name_bn: 'মোছা. সালমা আক্তার',          name_en: 'Salma Akter',               gender: 'F', repeater: false },
    { roll: 25, name_bn: 'মুক্তা রানী দাস',             name_en: 'Mukta Rani Das',            gender: 'F', repeater: false },
    { roll: 26, name_bn: 'স্নেহা রানী দেবনাথ',          name_en: 'Sneha Rani Debnath',        gender: 'F', repeater: false },
    { roll: 27, name_bn: 'অর্পিতা সরকার',               name_en: 'Arpita Sarkar',             gender: 'F', repeater: false },
    { roll: 28, name_bn: 'ঝর্না রানী বড়ুয়া',           name_en: 'Jharna Rani Barua',         gender: 'F', repeater: false },
    { roll: 29, name_bn: 'অনন্যা দত্ত',                 name_en: 'Ananya Dutta',              gender: 'F', repeater: false },
    { roll: 30, name_bn: 'বর্ষা রানী সাহা',             name_en: 'Barsha Rani Saha',          gender: 'F', repeater: false }
  ],

  // ── শ্রেণি ৩ (Class 3) ──────────────────────────────────
  3: [
    { roll:  1, name_bn: 'মো. রাসেল মিয়া',             name_en: 'Md. Rasel Mia',             gender: 'M', repeater: false },
    { roll:  2, name_bn: 'মো. শফিকুল ইসলাম',           name_en: 'Md. Shafiqul Islam',        gender: 'M', repeater: false },
    { roll:  3, name_bn: 'মো. মামুনুর রশিদ',            name_en: 'Md. Mamunur Rashid',        gender: 'M', repeater: false },
    { roll:  4, name_bn: 'মো. জুনায়েদ আহমেদ',          name_en: 'Md. Junaed Ahmed',          gender: 'M', repeater: false },
    { roll:  5, name_bn: 'মো. সজীব হাসান',              name_en: 'Md. Sajib Hasan',           gender: 'M', repeater: false },
    { roll:  6, name_bn: 'মো. রাফি আহমেদ',              name_en: 'Md. Rafi Ahmed',            gender: 'M', repeater: true  },
    { roll:  7, name_bn: 'মো. আব্দুর রহমান',            name_en: 'Md. Abdur Rahman',          gender: 'M', repeater: false },
    { roll:  8, name_bn: 'মো. শামীম হোসেন',             name_en: 'Md. Shamim Hossain',        gender: 'M', repeater: false },
    { roll:  9, name_bn: 'মো. নূরুল ইসলাম',             name_en: 'Md. Nurul Islam',           gender: 'M', repeater: false },
    { roll: 10, name_bn: 'মো. কামরুল হাসান',            name_en: 'Md. Kamrul Hasan',          gender: 'M', repeater: false },
    { roll: 11, name_bn: 'অনুপম সাহা',                  name_en: 'Anupam Saha',               gender: 'M', repeater: false },
    { roll: 12, name_bn: 'আকাশ দেবনাথ',                 name_en: 'Akash Debnath',             gender: 'M', repeater: false },
    { roll: 13, name_bn: 'প্রদীপ কুমার রায়',            name_en: 'Pradeep Kumar Roy',         gender: 'M', repeater: false },
    { roll: 14, name_bn: 'অমিত বিশ্বাস',                name_en: 'Amit Biswas',               gender: 'M', repeater: false },
    { roll: 15, name_bn: 'নীলয় দে',                    name_en: 'Niloy Dey',                 gender: 'M', repeater: false },
    { roll: 16, name_bn: 'মোছা. সুমাইয়া বেগম',          name_en: 'Sumaiya Begum',             gender: 'F', repeater: false },
    { roll: 17, name_bn: 'মোছা. রোজিনা আক্তার',          name_en: 'Rozina Akter',              gender: 'F', repeater: false },
    { roll: 18, name_bn: 'মোছা. মরিয়ম আক্তার',          name_en: 'Mariam Akter',              gender: 'F', repeater: false },
    { roll: 19, name_bn: 'মোছা. আফরোজা বেগম',           name_en: 'Afroza Begum',              gender: 'F', repeater: false },
    { roll: 20, name_bn: 'মোছা. মাহফুজা বেগম',          name_en: 'Mahfuza Begum',             gender: 'F', repeater: false },
    { roll: 21, name_bn: 'মোছা. রেশমা বেগম',            name_en: 'Reshma Begum',              gender: 'F', repeater: false },
    { roll: 22, name_bn: 'মোছা. সেলিনা আক্তার',          name_en: 'Selina Akter',              gender: 'F', repeater: false },
    { roll: 23, name_bn: 'মোছা. রোকসানা বেগম',          name_en: 'Roksana Begum',             gender: 'F', repeater: false },
    { roll: 24, name_bn: 'মোছা. লিপি আক্তার',           name_en: 'Lipi Akter',                gender: 'F', repeater: false },
    { roll: 25, name_bn: 'পিয়া রানী বড়ুয়া',           name_en: 'Piya Rani Barua',           gender: 'F', repeater: false },
    { roll: 26, name_bn: 'ঊর্মি রানী সাহা',             name_en: 'Urmi Rani Saha',            gender: 'F', repeater: false },
    { roll: 27, name_bn: 'মধুমিতা দাস',                 name_en: 'Madhumita Das',             gender: 'F', repeater: false },
    { roll: 28, name_bn: 'ললিতা রানী দত্ত',             name_en: 'Lalita Rani Dutta',         gender: 'F', repeater: false },
    { roll: 29, name_bn: 'ক্ষমা রানী বিশ্বাস',          name_en: 'Khama Rani Biswas',         gender: 'F', repeater: false },
    { roll: 30, name_bn: 'সীমা রানী চাকমা',             name_en: 'Sima Rani Chakma',          gender: 'F', repeater: false }
  ],

  // ── শ্রেণি ৪ (Class 4) ──────────────────────────────────
  4: [
    { roll:  1, name_bn: 'মো. জুলফিকার আলী',          name_en: 'Md. Zulfiqar Ali',          gender: 'M', repeater: false },
    { roll:  2, name_bn: 'মো. আব্দুল করিম',            name_en: 'Md. Abdul Karim',           gender: 'M', repeater: false },
    { roll:  3, name_bn: 'মো. শাহজালাল',               name_en: 'Md. Shahjalal',             gender: 'M', repeater: false },
    { roll:  4, name_bn: 'মো. মোস্তাফিজুর রহমান',      name_en: 'Md. Mostafizur Rahman',     gender: 'M', repeater: false },
    { roll:  5, name_bn: 'মো. জাহাঙ্গীর আলম',          name_en: 'Md. Jahangir Alam',         gender: 'M', repeater: false },
    { roll:  6, name_bn: 'মো. ওমর ফারুক',              name_en: 'Md. Omar Faruk',            gender: 'M', repeater: false },
    { roll:  7, name_bn: 'মো. আকবর আলী',               name_en: 'Md. Akbar Ali',             gender: 'M', repeater: false },
    { roll:  8, name_bn: 'মো. বেলাল হোসেন',            name_en: 'Md. Belal Hossain',         gender: 'M', repeater: true  },
    { roll:  9, name_bn: 'মো. রফিকুল ইসলাম',           name_en: 'Md. Rafiqul Islam',         gender: 'M', repeater: false },
    { roll: 10, name_bn: 'মো. নজরুল ইসলাম',            name_en: 'Md. Nazrul Islam',          gender: 'M', repeater: false },
    { roll: 11, name_bn: 'পার্থ প্রতিম রায়',           name_en: 'Partho Pratim Roy',         gender: 'M', repeater: false },
    { roll: 12, name_bn: 'শুভ্র সাহা',                  name_en: 'Shuvra Saha',               gender: 'M', repeater: false },
    { roll: 13, name_bn: 'সুব্রত কুমার দাস',            name_en: 'Subrata Kumar Das',         gender: 'M', repeater: false },
    { roll: 14, name_bn: 'নিলয় কান্তি নাথ',            name_en: 'Nilay Kanti Nath',          gender: 'M', repeater: false },
    { roll: 15, name_bn: 'প্রিয়ম দেবনাথ',              name_en: 'Priyam Debnath',            gender: 'M', repeater: false },
    { roll: 16, name_bn: 'মোছা. হালিমা আক্তার',         name_en: 'Halima Akter',              gender: 'F', repeater: false },
    { roll: 17, name_bn: 'মোছা. জান্নাতুল ফেরদৌস',     name_en: 'Jannatul Ferdous',          gender: 'F', repeater: false },
    { roll: 18, name_bn: 'মোছা. ফাতেমা আক্তার',         name_en: 'Fatema Akter',              gender: 'F', repeater: false },
    { roll: 19, name_bn: 'মোছা. নাজমা বেগম',            name_en: 'Nazma Begum',               gender: 'F', repeater: false },
    { roll: 20, name_bn: 'মোছা. মিনু আক্তার',           name_en: 'Minu Akter',                gender: 'F', repeater: false },
    { roll: 21, name_bn: 'মোছা. মুনিয়া আক্তার',         name_en: 'Munia Akter',               gender: 'F', repeater: false },
    { roll: 22, name_bn: 'মোছা. সেতু আক্তার',           name_en: 'Setu Akter',                gender: 'F', repeater: false },
    { roll: 23, name_bn: 'মোছা. সাবিনা আক্তার',          name_en: 'Sabina Akter',              gender: 'F', repeater: false },
    { roll: 24, name_bn: 'মোছা. নূরজাহান বেগম',          name_en: 'Nurjahan Begum',            gender: 'F', repeater: false },
    { roll: 25, name_bn: 'অনন্যা রানী দত্ত',            name_en: 'Ananya Rani Dutta',         gender: 'F', repeater: false },
    { roll: 26, name_bn: 'সংগীতা রানী বিশ্বাস',          name_en: 'Sangita Rani Biswas',       gender: 'F', repeater: false },
    { roll: 27, name_bn: 'অর্চনা রানী দাস',              name_en: 'Archana Rani Das',          gender: 'F', repeater: false },
    { roll: 28, name_bn: 'সুবর্ণা রানী সাহা',            name_en: 'Subarna Rani Saha',         gender: 'F', repeater: false },
    { roll: 29, name_bn: 'গোলাপী রানী বড়ুয়া',          name_en: 'Golapi Rani Barua',         gender: 'F', repeater: false },
    { roll: 30, name_bn: 'কাজল রানী দে',                name_en: 'Kajal Rani Dey',            gender: 'F', repeater: false }
  ],

  // ── শ্রেণি ৫ (Class 5) ──────────────────────────────────
  5: [
    { roll:  1, name_bn: 'মো. আলাউদ্দিন',              name_en: 'Md. Alauddin',              gender: 'M', repeater: false },
    { roll:  2, name_bn: 'মো. হামিদুল ইসলাম',          name_en: 'Md. Hamidul Islam',         gender: 'M', repeater: false },
    { roll:  3, name_bn: 'মো. সিরাজুল ইসলাম',          name_en: 'Md. Sirajul Islam',         gender: 'M', repeater: false },
    { roll:  4, name_bn: 'মো. মাহমুদুল হাসান',          name_en: 'Md. Mahmudul Hasan',        gender: 'M', repeater: false },
    { roll:  5, name_bn: 'মো. তৌহিদুল ইসলাম',          name_en: 'Md. Touhidul Islam',        gender: 'M', repeater: false },
    { roll:  6, name_bn: 'মো. এমদাদুল হক',             name_en: 'Md. Emdadul Haq',           gender: 'M', repeater: false },
    { roll:  7, name_bn: 'মো. নুরুল আমিন',             name_en: 'Md. Nurul Amin',            gender: 'M', repeater: false },
    { roll:  8, name_bn: 'মো. মিজানুর রহমান',          name_en: 'Md. Mizanur Rahman',        gender: 'M', repeater: false },
    { roll:  9, name_bn: 'মো. মশিউর রহমান',            name_en: 'Md. Mashiur Rahman',        gender: 'M', repeater: false },
    { roll: 10, name_bn: 'মো. সাইফুল ইসলাম',           name_en: 'Md. Saiful Islam',          gender: 'M', repeater: true  },
    { roll: 11, name_bn: 'মৃত্যুঞ্জয় সাহা',             name_en: 'Mrityunjoy Saha',           gender: 'M', repeater: false },
    { roll: 12, name_bn: 'জয়ন্ত কুমার দাস',            name_en: 'Joyanta Kumar Das',         gender: 'M', repeater: false },
    { roll: 13, name_bn: 'মানস কুমার রায়',              name_en: 'Manas Kumar Roy',           gender: 'M', repeater: false },
    { roll: 14, name_bn: 'সঞ্জয় কুমার নাথ',            name_en: 'Sanjay Kumar Nath',         gender: 'M', repeater: false },
    { roll: 15, name_bn: 'প্রবীর কুমার দে',             name_en: 'Prabir Kumar Dey',          gender: 'M', repeater: false },
    { roll: 16, name_bn: 'মোছা. শামসুন নাহার',          name_en: 'Shamsun Nahar',             gender: 'F', repeater: false },
    { roll: 17, name_bn: 'মোছা. আসমা আক্তার',           name_en: 'Asma Akter',                gender: 'F', repeater: false },
    { roll: 18, name_bn: 'মোছা. রাহেলা বেগম',           name_en: 'Rahela Begum',              gender: 'F', repeater: false },
    { roll: 19, name_bn: 'মোছা. সুফিয়া বেগম',           name_en: 'Sufia Begum',               gender: 'F', repeater: false },
    { roll: 20, name_bn: 'মোছা. রহিমা খাতুন',           name_en: 'Rahima Khatun',             gender: 'F', repeater: false },
    { roll: 21, name_bn: 'মোছা. জরিনা বেগম',            name_en: 'Jorina Begum',              gender: 'F', repeater: false },
    { roll: 22, name_bn: 'মোছা. আলেয়া বেগম',           name_en: 'Aleya Begum',               gender: 'F', repeater: false },
    { roll: 23, name_bn: 'মোছা. পারভীন আক্তার',         name_en: 'Parveen Akter',             gender: 'F', repeater: false },
    { roll: 24, name_bn: 'মোছা. রোমেলা বেগম',           name_en: 'Romela Begum',              gender: 'F', repeater: false },
    { roll: 25, name_bn: 'সরস্বতী রানী দত্ত',           name_en: 'Saraswati Rani Dutta',      gender: 'F', repeater: false },
    { roll: 26, name_bn: 'রুমা রানী বড়ুয়া',            name_en: 'Ruma Rani Barua',           gender: 'F', repeater: false },
    { roll: 27, name_bn: 'অমিতা রানী দে',               name_en: 'Amita Rani Dey',            gender: 'F', repeater: false },
    { roll: 28, name_bn: 'মায়া রানী সাহা',              name_en: 'Maya Rani Saha',            gender: 'F', repeater: false },
    { roll: 29, name_bn: 'শিউলি রানী নাথ',              name_en: 'Shiuli Rani Nath',          gender: 'F', repeater: false },
    { roll: 30, name_bn: 'কল্যাণী রানী বিশ্বাস',        name_en: 'Kalyani Rani Biswas',       gender: 'F', repeater: false }
  ]
};

// ============================================================
//  GOVERNMENT HOLIDAYS — Bangladesh Govt. Primary School
//  - Friday & Saturday are weekly holidays (handled in app.js)
//  - Add 2027 (or any year) govt primary school holidays below
// ============================================================
const HOLIDAYS_2026 = [
  { date: '2026-01-01', name_bn: 'নববর্ষ (ইংরেজি)' },
  { date: '2026-02-21', name_bn: 'আন্তর্জাতিক মাতৃভাষা দিবস' },
  { date: '2026-03-01', name_bn: 'শবে বরাত' },
  { date: '2026-03-17', name_bn: 'জাতির পিতার জন্মদিন' },
  { date: '2026-03-26', name_bn: 'স্বাধীনতা ও জাতীয় দিবস' },
  { date: '2026-03-28', name_bn: 'শবে কদর' },
  { date: '2026-03-30', name_bn: 'ঈদুল ফিতর' },
  { date: '2026-03-31', name_bn: 'ঈদুল ফিতর (২য় দিন)' },
  { date: '2026-04-01', name_bn: 'ঈদুল ফিতর (৩য় দিন)' },
  { date: '2026-04-14', name_bn: 'পহেলা বৈশাখ' },
  { date: '2026-05-01', name_bn: 'মে দিবস' },
  { date: '2026-05-25', name_bn: 'বুদ্ধ পূর্ণিমা' },
  { date: '2026-06-06', name_bn: 'ঈদুল আযহা' },
  { date: '2026-06-07', name_bn: 'ঈদুল আযহা (২য় দিন)' },
  { date: '2026-06-08', name_bn: 'ঈদুল আযহা (৩য় দিন)' },
  { date: '2026-07-06', name_bn: 'আশুরা' },
  { date: '2026-08-15', name_bn: 'জাতীয় শোক দিবস' },
  { date: '2026-08-25', name_bn: 'জন্মাষ্টমী' },
  { date: '2026-09-05', name_bn: 'ঈদে মিলাদুন্নবী' },
  { date: '2026-10-02', name_bn: 'দুর্গাপূজা (মহাষ্টমী)' },
  { date: '2026-10-03', name_bn: 'দুর্গাপূজা (মহানবমী)' },
  { date: '2026-10-04', name_bn: 'দুর্গাপূজা (বিজয়া দশমী)' },
  { date: '2026-11-14', name_bn: 'শবে মেরাজ' },
  { date: '2026-12-16', name_bn: 'বিজয় দিবস' },
  { date: '2026-12-25', name_bn: 'বড়দিন' }
];

// ২০২৭ সালের সরকারি প্রাথমিক বিদ্যালয়ের ছুটির তালিকা এখানে যোগ করুন
// অথবা অ্যাপের ভেতর থেকে "📅 ছুটি" বাটনে ক্লিক করেও যোগ করতে পারবেন।
const HOLIDAYS_2027 = [
  // উদাহরণ:
  // { date: '2027-02-21', name_bn: 'আন্তর্জাতিক মাতৃভাষা দিবস' },
  // { date: '2027-03-26', name_bn: 'স্বাধীনতা ও জাতীয় দিবস' },
  // { date: '2027-04-14', name_bn: 'পহেলা বৈশাখ' },
  // { date: '2027-05-01', name_bn: 'মে দিবস' },
  // { date: '2027-12-16', name_bn: 'বিজয় দিবস' },
  // { date: '2027-12-25', name_bn: 'বড়দিন' }
];

const DEFAULT_HOLIDAYS = [...HOLIDAYS_2026, ...HOLIDAYS_2027];
const HOLIDAY_SET = new Set(DEFAULT_HOLIDAYS.map(h => h.date));
