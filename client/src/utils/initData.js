// Initialize default data on app startup
export const initializeDefaultData = () => {
  // Initialize default admin user if not exists
  const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
  
  const adminUser = {
    id: 'admin-001',
    name: 'Administrator',
    email: 'admin@tourvista.com',
    phone: '+91 9876543210',
    role: 'admin',
    createdAt: new Date().toISOString()
  };

  if (!allUsers.find(u => u.email === 'admin@tourvista.com')) {
    allUsers.push(adminUser);
    localStorage.setItem('allUsers', JSON.stringify(allUsers));
  }

  // Initialize default tours if not exists
  const defaultTours = [
    {
      id: 1,
      title: 'Taj Mahal & Golden Triangle',
      description: 'Experience the iconic Taj Mahal and explore Delhi, Agra, and Jaipur. Visit historical monuments and experience rich Mughal heritage.',
      price: '₹24,999',
      duration: '7 days',
      image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      region: 'north',
      type: 'heritage'
    },
    {
      id: 2,
      title: 'Kerala Backwaters & Beaches',
      description: 'Houseboat experience through serene backwaters and beautiful beaches. Experience authentic Kerala culture and cuisine.',
      price: '₹18,999',
      duration: '8 days',
      image: 'https://tse4.mm.bing.net/th/id/OIP.J5VQPA5KVcTKfxc3f1441QHaEK?rs=1&pid=ImgDetMain&o=7&rm=3',
      region: 'south',
      type: 'beach'
    },
    {
      id: 3,
      title: 'Goa Beach Paradise',
      description: 'Relax on sun-kissed beaches and explore Portuguese heritage. Enjoy water sports, seafood, and vibrant nightlife.',
      price: '₹14,999',
      duration: '5 days',
      image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      region: 'west',
      type: 'beach'
    },
    {
      id: 4,
      title: 'Leh-Ladakh Adventure',
      description: 'High-altitude adventure through stunning Himalayan landscapes. Visit monasteries, lakes, and experience unique culture.',
      price: '₹32,999',
      duration: '10 days',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Road_Padum_Zanskar_Range_Jun24_A7CR_00818.jpg/1280px-Road_Padum_Zanskar_Range_Jun24_A7CR_00818.jpg',
      region: 'north',
      type: 'adventure'
    }
  ];

  const existingTours = JSON.parse(localStorage.getItem('tours') || '[]');
  if (existingTours.length === 0) {
    localStorage.setItem('tours', JSON.stringify(defaultTours));
  }
};