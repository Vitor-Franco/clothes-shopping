import { GetStaticPaths, GetStaticProps } from "next";
import Image from "next/future/image";
import { useRouter } from "next/router";
import Stripe from "stripe";
import { stripe } from "../../lib/stripe";
import {
  ImageContainer,
  ProductContainer,
  ProductDetails,
} from "../../styles/pages/product";

import axios from "axios";
import { useState } from "react";
import Head from "next/head";

interface ProductProps {
  product: {
    id: string;
    name: string;
    imageUrl: string;
    price: string;
    description: string;
    defaultPriceId: string;
  };
}

export default function Product({ product }: ProductProps) {
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const { isFallback } = useRouter(); // isFallback is true when the page is being generated

  if (isFallback) {
    return <p>Carregando...</p>;
  }

  async function handleBuyProduct() {
    try {
      setIsCreatingCheckout(true);
      const response = await axios.post("/api/checkout", {
        priceId: product.defaultPriceId,
      });

      const { checkoutUrl } = response.data;

      window.location.href = checkoutUrl;
    } catch (error) {
      // Conectar com uma ferramenta de monitoramento de erros (Sentry, Bugsnag, Datadog)

      setIsCreatingCheckout(false);
      alert("Falha ao criar checkout");
    }
  }

  return (
    <>
      <Head>
        <title>{product.name} | Ignite Shop</title>
      </Head>

      <ProductContainer>
        <ImageContainer>
          <Image src={product.imageUrl} width={520} height={480} alt="" />
        </ImageContainer>

        <ProductDetails>
          <h1>{product.name}</h1>
          <span>{product.price}</span>
          <p>{product.description}</p>

          <button disabled={isCreatingCheckout} onClick={handleBuyProduct}>
            Comprar agora
          </button>
        </ProductDetails>
      </ProductContainer>
    </>
  );
}

// Método responsável por devolver os IDs dos produtos que serão gerados de forma estática
// No momento do build, para que a aplicação saiba requisitar essas páginas.
export const getStaticPaths: GetStaticPaths = async () => {
  // Buscar os produtos mais acessados / mais vendidos.

  return {
    paths: [
      {
        params: {
          id: "",
        },
      },
    ],
    fallback: true,
    // Se true, a página será gerada no momento da requisição.
    // Se false, a página não será gerada no momento da requisição e o usuário receberá um erro 404.
    // Se blocking, a página será gerada no momento da requisição e o usuário só verá a página após a geração. (não terá o carregamento)
  };
};

// Fornece pra gente páginas estáticas.
export const getStaticProps: GetStaticProps<any, { id: string }> = async ({
  params,
}) => {
  const { id } = params;

  const product = await stripe.products.retrieve(id, {
    expand: ["default_price"],
  });

  const price = product.default_price as Stripe.Price;

  return {
    props: {
      product: {
        id: product.id,
        name: product.name,
        imageUrl: product.images[0],
        price: new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(price.unit_amount / 100),
        description: product.description,
        defaultPriceId: price.id,
      },
    },
    revalidate: 60 * 60 * 1, // 1 hours
  };
};
