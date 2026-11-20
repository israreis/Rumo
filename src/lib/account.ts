import { supabase } from "@/integrations/supabase/client";

/** Lista recursivamente os arquivos de uma pasta do bucket (o Storage não lista subpastas sozinho). */
async function listFiles(bucket: string, prefix: string, depth = 0): Promise<string[]> {
  if (depth > 4) return [];
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !data) return [];
  const out: string[] = [];
  for (const item of data) {
    const path = `${prefix}/${item.name}`;
    // Pastas vêm sem id
    if (item.id) out.push(path);
    else out.push(...(await listFiles(bucket, path, depth + 1)));
  }
  return out;
}

/** Envia um código de confirmação para o e-mail da conta (modelo "Magic link or OTP" do Supabase). */
export async function sendAccountCode(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  if (error) {
    const m = error.message.toLowerCase();
    throw new Error(m.includes("rate") || m.includes("seconds") ? "Muitos envios seguidos. Espere um pouco e tente de novo." : "Não foi possível enviar o código.");
  }
}

/** Confere o código recebido por e-mail. */
export async function verifyAccountCode(email: string, code: string) {
  const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });
  if (error) throw new Error("Código inválido ou expirado.");
}

/**
 * Apaga a conta: arquivos do usuário no Storage, depois as viagens e a conta no banco
 * (função delete_my_account), e por fim a sessão local.
 */
export async function deleteMyAccount(userId: string) {
  const files = await listFiles("media", userId);
  for (let i = 0; i < files.length; i += 100) {
    await supabase.storage.from("media").remove(files.slice(i, i + 100));
  }
  const { error } = await supabase.rpc("delete_my_account");
  if (error) throw new Error("Não foi possível excluir a conta. Tente novamente.");
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
}
