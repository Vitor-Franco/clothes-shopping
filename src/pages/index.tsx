import Image from "next/future/image";
import { stripe } from "../lib/stripe";
import { GetStaticProps } from "next";
import { useKeenSlider } from "keen-slider/react";
import { HomeContainer, Product } from "../styles/pages/home";

import "keen-slider/keen-slider.min.css";
import Stripe from "stripe";
import Link from "next/link";
import Head from "next/head";

interface HomeProps {
  products: {
    id: string;
    name: string;
    imageUrl: string;
    price: string;
  }[];
}

export default function Home({ products }: HomeProps) {
  const [sliderRef] = useKeenSlider({
    slides: {
      perView: 2.5,
      spacing: 48,
    },
  });

  return (
    <>
      <Head>
        <title>Home | IgniteShop</title>
      </Head>
      
      <HomeContainer ref={sliderRef} className="keen-slider">
        {products.map((product) => (
          <Link href={`/product/${product.id}`} key={product.id}>
            <Product className="keen-slider__slide">
              <Image src={product.imageUrl} width={520} height={480} alt="" />

              <footer>
                <strong>{product.name}</strong>
                <span>{product.price}</span>
              </footer>
            </Product>
          </Link>
        ))}
      </HomeContainer>
    </>
  );
}

// Gera uma versão da página na qual os dados são pré-renderizados em build time
// Sendo assim, não é necessário fazer uma requisição para a API toda vez que a página for acessada
export const getStaticProps: GetStaticProps = async () => {
  const response = await stripe.products.list({
    expand: ["data.default_price"],
  });

  const products = response.data.map((product) => {
    const price = product.default_price as Stripe.Price;

    return {
      id: product.id,
      name: product.name,
      imageUrl: product.images[0],
      price: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(price.unit_amount / 100),
    };
  });

  return {
    props: {
      products,
    },
    revalidate: 60 * 60 * 2, // 2 hours
  };
};
