import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const movies = [
    {
      title: "The Shawshank Redemption",
      director: "Frank Darabont",
      genre: "Drama",
      releaseYear: 1994,
      rating: 9.3,
      description:
        "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
    },
    {
      title: "The Godfather",
      director: "Francis Ford Coppola",
      genre: "Crime",
      releaseYear: 1972,
      rating: 9.2,
      description:
        "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
    },
    {
      title: "The Dark Knight",
      director: "Christopher Nolan",
      genre: "Action",
      releaseYear: 2008,
      rating: 9.0,
      description:
        "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.",
    },
    {
      title: "Inception",
      director: "Christopher Nolan",
      genre: "Sci-Fi",
      releaseYear: 2010,
      rating: 8.8,
      description:
        "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.",
    },
    {
      title: "Pulp Fiction",
      director: "Quentin Tarantino",
      genre: "Crime",
      releaseYear: 1994,
      rating: 8.9,
      description:
        "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.",
    },
  ];

  for (const movie of movies) {
    await prisma.movie.create({
      data: movie,
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
