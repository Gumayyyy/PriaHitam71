const teamMembers = [
  {
    name: "Muhammad Ibrahim Gumay",
    role: "Application Developer",
    desc: "Nama saya Muhammad Ibrahim Gumay dan saya berperan sebagai Application Developer dalam tim ini. Tugas utama saya adalah merancang serta mengembangkan logika utama yang menjadi dasar berjalannya sebuah website. Saya bertanggung jawab dalam menyusun alur kerja sistem agar setiap fitur dapat berfungsi dengan baik dan saling terhubung. Selain itu, saya juga mengelola database untuk memastikan data tersimpan secara terstruktur, aman, dan mudah diakses ketika dibutuhkan. Peran ini sangat penting karena menjadi pusat pengendali bagaimana website bekerja, mulai dari proses pengolahan data hingga interaksi antara pengguna dan sistem secara keseluruhan.",
  },
  {
    name: "Reno Zihni Shahzada",
    role: "Web Developer",
    desc: "Nama saya Reno Zihni Shahzada dan saya bertugas sebagai Web Developer. Dalam tim ini, saya bertanggung jawab untuk membangun dan mengembangkan website dari sisi teknis melalui proses pengkodean. Saya menggunakan bahasa pemrograman seperti HTML, CSS, dan JavaScript untuk membuat tampilan dan fitur website dapat berjalan sesuai dengan perancangan yang telah dibuat. Selain itu, saya juga memastikan website bebas dari error, melakukan perbaikan bug, serta mengoptimalkan performa agar website dapat diakses dengan cepat dan responsif di berbagai perangkat. Peran ini sangat penting untuk memastikan website dapat digunakan dengan lancar oleh pengguna.",
  },
  {
    name: "Raffi Baldy Anugrah",
    role: "Content Writer",
    desc: "Nama saya Raffi Baldy Anugrah dan saya berperan sebagai Content Writer dalam tim ini. Tugas saya adalah menyusun, menulis, serta mengelola seluruh konten yang terdapat pada website. Saya membuat berbagai jenis konten seperti artikel, deskripsi layanan, panduan penggunaan, serta informasi lain yang dibutuhkan oleh pengguna. Dalam proses penulisan, saya memastikan konten yang dibuat bersifat jelas, informatif, akurat, dan mudah dipahami oleh semua kalangan. Selain menyampaikan informasi, konten juga berfungsi untuk membangun komunikasi yang baik antara website dan penggunanya sehingga pesan yang ingin disampaikan dapat diterima dengan efektif.",
  },
  {
    name: "Zevansyah Izzat Oktavio",
    role: "Graphic Designer",
    desc: "Nama saya Zevansyah Izzat Oktavio dan saya bertugas sebagai Graphic Designer. Saya bertanggung jawab dalam merancang tampilan visual website agar terlihat menarik, estetis, dan profesional. Pekerjaan saya meliputi pemilihan warna, penataan layout, penggunaan jenis huruf, serta pembuatan ikon dan elemen visual lainnya yang mendukung tampilan website. Selain memperhatikan keindahan desain, saya juga memastikan tampilan website nyaman digunakan dan mudah dipahami oleh pengguna atau user-friendly. Peran ini sangat penting karena desain visual menjadi kesan pertama yang dilihat pengunjung ketika mengakses website.",
  },
];

const cards = document.querySelectorAll(".slide");
const dots = document.querySelectorAll(".dot");
const memberName = document.querySelector(".member-name");
const memberRole = document.querySelector(".member-role");
const memberDesc = document.querySelector(".member-desc");
const upArrows = document.querySelectorAll(".nav-arrow.up");
const downArrows = document.querySelectorAll(".nav-arrow.down");
const pages = document.querySelectorAll(".page");
const prevPageBtn = document.querySelector(".prev-page-btn");
const nextPageBtn = document.querySelector(".next-page-btn");
const PROFILE_PAGE_STORAGE_KEY = "profileActivePageIndex";
let currentIndex = 0;
let currentPageIndex = 0;
let isAnimating = false;

// Keep URL clean when users navigate across profile sections.
function clearUrlHash() {
  if (!window.location.hash) return;
  const cleanUrl = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(null, "", cleanUrl);
}

// Restore last opened section index from session storage.
function getSavedPageIndex() {
  const savedValue = window.sessionStorage.getItem(PROFILE_PAGE_STORAGE_KEY);
  if (savedValue === null) return 0;

  const parsedIndex = Number.parseInt(savedValue, 10);
  if (Number.isNaN(parsedIndex)) return 0;

  return Math.max(0, Math.min(parsedIndex, pages.length - 1));
}

function updateProfilePage(newPageIndex) {
  if (!pages.length) return;

  currentPageIndex = Math.max(0, Math.min(newPageIndex, pages.length - 1));

  pages.forEach((page, index) => {
    page.classList.toggle("page-active", index === currentPageIndex);
  });

  const activePage = pages[currentPageIndex];
  const hidePrev =
    currentPageIndex === 0 || activePage?.dataset.hidePrev === "true";
  const hideNext =
    currentPageIndex === pages.length - 1 ||
    activePage?.dataset.hideNext === "true";

  if (prevPageBtn) {
    prevPageBtn.hidden = hidePrev;
    prevPageBtn.style.display = hidePrev ? "none" : "flex";
  }

  if (nextPageBtn) {
    nextPageBtn.hidden = hideNext;
    nextPageBtn.style.display = hideNext ? "none" : "flex";
  }

  window.sessionStorage.setItem(
    PROFILE_PAGE_STORAGE_KEY,
    String(currentPageIndex),
  );
}

function updateCarousel(newIndex) {
  if (isAnimating) return;
  isAnimating = true;

  currentIndex = (newIndex + cards.length) % cards.length;

  cards.forEach((card, i) => {
    const offset = (i - currentIndex + cards.length) % cards.length;

    card.classList.remove(
      "center",
      "up-1",
      "up-2",
      "down-1",
      "down-2",
      "hidden",
    );

    if (offset === 0) {
      card.classList.add("center");
    } else if (offset === 1) {
      card.classList.add("down-1");
    } else if (offset === 2) {
      card.classList.add("down-2");
    } else if (offset === cards.length - 1) {
      card.classList.add("up-1");
    } else if (offset === cards.length - 2) {
      card.classList.add("up-2");
    } else {
      card.classList.add("hidden");
    }
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === currentIndex);
  });

  memberName.style.opacity = "0";
  memberRole.style.opacity = "0";
  if (memberDesc) memberDesc.style.opacity = "0";

  setTimeout(() => {
    memberName.textContent = teamMembers[currentIndex].name;
    memberRole.textContent = teamMembers[currentIndex].role;
    if (memberDesc) memberDesc.textContent = teamMembers[currentIndex].desc;
    memberName.style.opacity = "1";
    memberRole.style.opacity = "1";
    if (memberDesc) memberDesc.style.opacity = "1";
  }, 300);

  setTimeout(() => {
    isAnimating = false;
  }, 800);
}

upArrows.forEach((arrow) => {
  arrow.addEventListener("click", () => {
    updateCarousel(currentIndex + 1);
  });
});

downArrows.forEach((arrow) => {
  arrow.addEventListener("click", () => {
    updateCarousel(currentIndex - 1);
  });
});

dots.forEach((dot, i) => {
  dot.addEventListener("click", () => {
    updateCarousel(i);
  });
});

cards.forEach((card, i) => {
  card.addEventListener("click", () => {
    updateCarousel(i);
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") {
    updateCarousel(currentIndex + 1);
  } else if (e.key === "ArrowDown") {
    updateCarousel(currentIndex - 1);
  } else if (e.key === "ArrowRight") {
    updateProfilePage(currentPageIndex + 1);
  } else if (e.key === "ArrowLeft") {
    updateProfilePage(currentPageIndex - 1);
  }
});

let touchStartX = 0;
let touchEndX = 0;

document.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenY;
});

document.addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].screenY;
  handleSwipe();
});

function handleSwipe() {
  const swipeThreshold = 50;
  const diff = touchStartX - touchEndX;

  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      updateCarousel(currentIndex + 1);
    } else {
      updateCarousel(currentIndex - 1);
    }
  }
}

if (prevPageBtn) {
  prevPageBtn.addEventListener("click", () => {
    updateProfilePage(currentPageIndex - 1);
  });
}

if (nextPageBtn) {
  nextPageBtn.addEventListener("click", () => {
    updateProfilePage(currentPageIndex + 1);
  });
}

updateCarousel(0);
updateProfilePage(getSavedPageIndex());
clearUrlHash();

window.addEventListener("hashchange", () => {
  clearUrlHash();
});
